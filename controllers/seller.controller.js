import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Shipment from "../models/Shipment.js";
import Seller from "../models/Seller.js";
import User from "../models/User.js";
import EmailLog from "../models/EmailLog.js";
import ReferralInvite from "../models/ReferralInvite.js";
import BulkInquiry from "../models/BulkInquiry.js";
import ReturnRequest from "../models/ReturnRequest.js";
import CartAddEvent from "../models/CartAddEvent.js";
import ProductViewEvent from "../models/ProductViewEvent.js";
import Review from "../models/Review.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import {
  sendPremiumUpgradeEmail,
  sendSellerReferralInviteEmail,
} from "../services/email.service.js";
import { runSubscriptionReminders } from "../cron/subscriptionReminders.js";
import { runReferralFollowUps } from "../cron/referralFollowUps.js";
import { absoluteToWebPath } from "../utils/uploadPaths.js";
import {
  getPurchaseTypeOptionsForSeller,
  isSubscribedSeller,
} from "../utils/productInventoryRules.js";
import { getMaxOrderQuantityLimit } from "../utils/productOrderQuantity.js";
import { getSellerCategoryLimitsForApi } from "../utils/sellerCategoryRules.js";
import {
  assertKycLogoUpload,
  assertKycCertificateUpload,
  assertKycImageUpload,
  getKycMissingFields,
  validatePanNumber,
  validateGstNumber,
} from "../utils/kycValidation.js";
import {
  getDefaultSellerPlatformFeePercent,
  parseAdminCostPercentage,
} from "../utils/sellerPlatformFee.js";
import {
  SELLER_REFER_PROGRAM,
  SELLER_REFER_PLAN_ROWS,
  SELLER_ABOUT_US,
} from "../utils/sellerHubContent.js";
import {
  ensureSellerReferralCode,
  getReferralStatsForSeller,
  sellerPortalBaseUrl,
  sellerRegisterUrl,
} from "../utils/sellerReferral.js";
import { capListLimit } from "../utils/clientDevice.js";
import {
  getRecentSellerActivities,
  logKycActivity,
  logPremiumActivity,
} from "../services/sellerActivity.service.js";
import { validateSellerEntityType } from "../utils/kycEntityTypes.js";
import { validateUpgradeVoucher } from "../utils/voucherHelper.js";
import AdminVoucher from "../models/AdminVoucher.js";
import VoucherUsage from "../models/VoucherUsage.js";

// Small in-memory cache to reduce repeated heavy analytics recompute
// (e.g., user toggling last7/last15/last30 quickly).
const __analyticsCache = new Map();
const getCachedAnalytics = (key) => {
  const hit = __analyticsCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    __analyticsCache.delete(key);
    return null;
  }
  return hit.value;
};
const setCachedAnalytics = (key, value, ttlMs) => {
  __analyticsCache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

const firstProductImage = (images) =>
  Array.isArray(images) && images.length > 0 ? images[0] : "";

const productDocsByIds = async (ids, select = "title images") => {
  const unique = [...new Set(ids.map((id) => String(id)).filter(Boolean))];
  if (!unique.length) return new Map();
  const docs = await Product.find({ _id: { $in: unique } }).select(select).lean();
  return new Map(docs.map((p) => [p._id.toString(), p]));
};

function getRazorpayOrThrow() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    const err = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment."
    );
    err.statusCode = 503;
    throw err;
  }
  return new Razorpay({ key_id, key_secret });
}

/** Total charged in paise (₹9,125 + 18% GST = ₹10,767.50 → 1076750) */
function getPremiumAmountPaise() {
  const raw = process.env.PREMIUM_SUBSCRIPTION_AMOUNT_PAISE;
  const n = raw != null ? parseInt(String(raw), 10) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 1076750;
}

function safeCompareHex(a, b) {
  try {
    const ba = Buffer.from(String(a), "hex");
    const bb = Buffer.from(String(b), "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

// ===============================
// 📊 SELLER DASHBOARD
// ===============================
export const getDashboard = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete approval to access dashboard",
      });
    }

    const sellerId = new mongoose.Types.ObjectId(req.user._id);

    const stats = await Product.aggregate([
      {
        $match: {
          sellerId: sellerId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          totalValue: {
            $sum: { $multiply: ["$price", "$stock"] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
    };

    // Fetch referral stats for dashboard display
    let referralCreditsEarned = 0;
    let successfulReferrals = 0;
    try {
      const referralStats = await getReferralStatsForSeller(req.user._id, req.user, { limit: 1 });
      referralCreditsEarned = referralStats.creditsEarned || 0;
      successfulReferrals = referralStats.totalApproved || 0;
    } catch (err) {
      console.error("Failed to fetch referral stats for dashboard:", err);
    }

    res.status(200).json({
      message: "Dashboard fetched successfully",
      data: {
        ...result,
        referralCreditsEarned,
        successfulReferrals,
      },
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

// ===============================
// 📈 SELLER ANALYTICS DASHBOARD
// ===============================
export const getAnalytics = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user._id);
    const isPremium =
      req.user?.sellerType === "premium" && req.user?.subscriptionActive === true;
    const defaultRowLimit = isPremium ? 10 : 3;
    const rowLimitRaw = parseInt(String(req.query?.rowLimit ?? ""), 10);
    const rowLimit = Number.isFinite(rowLimitRaw)
      ? Math.min(Math.max(rowLimitRaw, 1), 1000)
      : defaultRowLimit;

    const parseYmdOrNull = (value) => {
      if (!value) return null;
      const s = String(value).trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
      const d = new Date(`${s}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime())) return null;
      return d;
    };

    const startOfDayUtc = (d) => {
      const x = new Date(d);
      x.setUTCHours(0, 0, 0, 0);
      return x;
    };

    const endOfDayUtc = (d) => {
      const x = new Date(d);
      x.setUTCHours(23, 59, 59, 999);
      return x;
    };

    const addDaysUtc = (d, days) => {
      const x = new Date(d);
      x.setUTCDate(x.getUTCDate() + days);
      return x;
    };

    const diffDaysInclusiveUtc = (from, to) => {
      const a = startOfDayUtc(from).getTime();
      const b = startOfDayUtc(to).getTime();
      const ms = b - a;
      return Math.floor(ms / (24 * 60 * 60 * 1000)) + 1;
    };

    const formatYmdUtc = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    const formatYmUtc = (d) => {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    };

    const rawPreset = (req.query?.preset ?? req.query?.range ?? "").toString().trim().toLowerCase();
    const preset =
      rawPreset === "last7" || rawPreset === "last_7_days" || rawPreset === "last-7-days"
        ? "last7"
        : rawPreset === "last15" || rawPreset === "last_15_days" || rawPreset === "last-15-days"
          ? "last15"
          : rawPreset === "last30" || rawPreset === "last_30_days" || rawPreset === "last-30-days"
            ? "last30"
            : rawPreset === "all" || rawPreset === "alltime" || rawPreset === "all_time"
              ? "all"
              : rawPreset === "custom"
                ? "custom"
                : "last30";

    const now = new Date();
    const today = startOfDayUtc(now);

    let fromDate = null;
    let toDate = null;

    if (preset === "all") {
      fromDate = null;
      toDate = null;
    } else if (preset === "custom") {
      const fromRaw = parseYmdOrNull(req.query?.from ?? req.query?.startDate);
      const toRaw = parseYmdOrNull(req.query?.to ?? req.query?.endDate);
      if (!fromRaw || !toRaw) {
        return res.status(400).json({
          success: false,
          message: "For custom range, provide from/to as YYYY-MM-DD.",
        });
      }
      fromDate = startOfDayUtc(fromRaw);
      toDate = endOfDayUtc(toRaw);
      if (toDate.getTime() < fromDate.getTime()) {
        return res.status(400).json({
          success: false,
          message: "`to` must be the same as or after `from`.",
        });
      }
    } else {
      const days = preset === "last7" ? 7 : preset === "last15" ? 15 : 30;
      fromDate = startOfDayUtc(addDaysUtc(today, -(days - 1)));
      toDate = endOfDayUtc(today);
    }

    const orderQuery = { "items.seller": sellerId, paymentStatus: "completed" };
    if (fromDate && toDate) {
      orderQuery.createdAt = { $gte: fromDate, $lte: toDate };
    }

    const cacheKey = JSON.stringify({
      sellerId: sellerId.toString(),
      preset,
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      rowLimit,
    });
    const cached = getCachedAnalytics(cacheKey);
    if (cached) {
      return res.status(200).json({
        success: true,
        message: "Analytics fetched successfully",
        data: cached,
      });
    }

    // Chart buckets: daily for shorter ranges, monthly for long/all-time.
    let useMonthlyChart = false;
    let salesChartMap = {};

    if (fromDate && toDate) {
      const days = diffDaysInclusiveUtc(fromDate, toDate);
      useMonthlyChart = days > 60;
      if (!useMonthlyChart) {
        for (let i = 0; i < days; i++) {
          const d = addDaysUtc(startOfDayUtc(fromDate), i);
          salesChartMap[formatYmdUtc(d)] = 0;
        }
      }
    } else {
      useMonthlyChart = true;
      const startMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
      for (let i = 0; i < 12; i++) {
        const m = new Date(Date.UTC(startMonth.getUTCFullYear(), startMonth.getUTCMonth() - i, 1));
        salesChartMap[formatYmUtc(m)] = 0;
      }
    }

    const chartDateFormat = useMonthlyChart ? "%Y-%m" : "%Y-%m-%d";
    const sellerIdStr = sellerId.toString();
    const dateFilter = fromDate && toDate ? { createdAt: { $gte: fromDate, $lte: toDate } } : {};
    const returnsSellerFilter = { seller: sellerId, ...dateFilter };
    const listedProductFilter = { sellerId, isDraft: { $ne: true } };
    const activeQuery = {
      sellerId,
      isDraft: { $ne: true },
      isActive: true,
      approvalStatus: "approved",
    };
    const inactiveQuery = {
      sellerId,
      isDraft: { $ne: true },
      $or: [{ isActive: false }, { approvalStatus: { $ne: "approved" } }],
    };
    const lowStockThreshold = (() => {
      const raw = req.query?.lowStock ?? req.query?.lowStockThreshold;
      const n = raw != null ? parseInt(String(raw), 10) : NaN;
      return Number.isFinite(n) && n >= 0 ? n : 5;
    })();
    const lowStockQuery = {
      sellerId,
      isDraft: { $ne: true },
      isActive: true,
      approvalStatus: "approved",
      stock: { $lte: lowStockThreshold },
    };
    const reviewDateMatch = fromDate && toDate ? dateFilter : {};
    const refundsFilter = { ...returnsSellerFilter, type: "Refund" };
    const replacementsFilter = { ...returnsSellerFilter, type: "Replacement" };

    const [
      orderFacetResult,
      recentOrders,
      productsListedTotal,
      productsListedRowsRaw,
      bulkTotal,
      bulkRowsRaw,
      viewsTotal,
      viewAgg,
      cartAddsTotal,
      cartAgg,
      returnsTotal,
      returnsRowsRaw,
      refundsTotal,
      refundsRowsRaw,
      replacementsTotal,
      replacementsAgg,
      reviewFacetResult,
      activeProductsTotal,
      activeProductsRowsRaw,
      activeInventoryValue,
      inactiveProductsTotal,
      inactiveProductsRowsRaw,
      inactiveInventoryValue,
      lowStockTotal,
      lowStockRowsRaw,
      customerAgg,
    ] = await Promise.all([
      Order.aggregate([
        { $match: orderQuery },
        {
          $facet: {
            orderLevel: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  pendingOrders: {
                    $sum: {
                      $cond: [
                        { $in: ["$orderStatus", ["Processing", "Packed"]] },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            itemLevel: [
              { $unwind: "$items" },
              { $match: { "items.seller": sellerId } },
              {
                $group: {
                  _id: null,
                  totalRevenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                  productsSold: { $sum: "$items.quantity" },
                },
              },
            ],
            topProducts: [
              { $unwind: "$items" },
              { $match: { "items.seller": sellerId } },
              {
                $group: {
                  _id: "$items.product",
                  title: { $first: "$items.title" },
                  quantity: { $sum: "$items.quantity" },
                  revenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                },
              },
              { $sort: { quantity: -1 } },
              { $limit: 5 },
            ],
            locations: [
              {
                $group: {
                  _id: { $ifNull: ["$shippingAddress.city", "Unknown"] },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 5 },
            ],
            chartRevenue: [
              { $unwind: "$items" },
              { $match: { "items.seller": sellerId } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: chartDateFormat, date: "$createdAt" },
                  },
                  revenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                },
              },
            ],
            productRevenue: [
              { $unwind: "$items" },
              { $match: { "items.seller": sellerId } },
              {
                $group: {
                  _id: "$items.product",
                  title: { $first: "$items.title" },
                  quantity: { $sum: "$items.quantity" },
                  revenue: {
                    $sum: { $multiply: ["$items.price", "$items.quantity"] },
                  },
                },
              },
              { $sort: { revenue: -1 } },
              { $limit: rowLimit },
            ],
          },
        },
      ]),
      Order.find(orderQuery)
        .populate("user", "firstName lastName email name")
        .select("createdAt orderStatus items user")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Product.countDocuments(listedProductFilter),
      Product.find(listedProductFilter)
        .sort({ createdAt: -1 })
        .select("title images stock sku variants")
        .limit(rowLimit)
        .lean(),
      BulkInquiry.countDocuments({ sellerId, ...dateFilter }),
      BulkInquiry.find({ sellerId, ...dateFilter })
        .populate("productId", "title images price")
        .sort({ createdAt: -1 })
        .limit(rowLimit)
        .lean(),
      ProductViewEvent.countDocuments({ sellerId, ...dateFilter }),
      ProductViewEvent.aggregate([
        { $match: { sellerId, ...dateFilter } },
        { $group: { _id: "$productId", views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: rowLimit },
      ]),
      CartAddEvent.countDocuments({ sellerId, ...dateFilter }),
      CartAddEvent.aggregate([
        { $match: { sellerId, ...dateFilter } },
        {
          $group: {
            _id: "$productId",
            customers: { $addToSet: "$userId" },
            adds: { $sum: 1 },
          },
        },
        {
          $project: {
            productId: "$_id",
            customersCount: { $size: "$customers" },
            adds: 1,
          },
        },
        { $sort: { adds: -1 } },
        { $limit: rowLimit },
      ]),
      ReturnRequest.countDocuments(returnsSellerFilter),
      ReturnRequest.find(returnsSellerFilter)
        .populate("product", "title images price")
        .sort({ createdAt: -1 })
        .limit(rowLimit)
        .lean(),
      ReturnRequest.countDocuments({ ...refundsFilter, refundStatus: "Processed" }),
      ReturnRequest.find(refundsFilter)
        .populate("product", "title images")
        .sort({ createdAt: -1 })
        .limit(rowLimit)
        .lean(),
      ReturnRequest.countDocuments(replacementsFilter),
      ReturnRequest.aggregate([
        { $match: replacementsFilter },
        {
          $group: {
            _id: "$product",
            customers: { $addToSet: "$user" },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            productId: "$_id",
            customersCount: { $size: "$customers" },
            count: 1,
          },
        },
        { $sort: { count: -1 } },
        { $limit: rowLimit },
      ]),
      Review.aggregate([
        ...(Object.keys(reviewDateMatch).length ? [{ $match: reviewDateMatch }] : []),
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDoc",
          },
        },
        { $unwind: "$productDoc" },
        { $match: { "productDoc.sellerId": sellerId } },
        {
          $facet: {
            rows: [
              {
                $group: {
                  _id: "$product",
                  avgRating: { $avg: "$rating" },
                  reviewsCount: { $sum: 1 },
                  customers: { $addToSet: "$user" },
                },
              },
              {
                $project: {
                  productId: "$_id",
                  avgRating: { $ifNull: ["$avgRating", 0] },
                  reviewsCount: 1,
                  customersCount: { $size: "$customers" },
                },
              },
              { $sort: { reviewsCount: -1 } },
              { $limit: rowLimit },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]),
      Product.countDocuments(activeQuery),
      Product.find(activeQuery)
        .sort({ updatedAt: -1 })
        .select("title images price stock")
        .limit(rowLimit)
        .lean(),
      Product.aggregate([
        { $match: activeQuery },
        {
          $group: {
            _id: null,
            value: { $sum: { $multiply: ["$price", "$stock"] } },
          },
        },
      ]),
      Product.countDocuments(inactiveQuery),
      Product.find(inactiveQuery)
        .sort({ updatedAt: -1 })
        .select("title images price stock approvalStatus")
        .limit(rowLimit)
        .lean(),
      Product.aggregate([
        { $match: inactiveQuery },
        {
          $group: {
            _id: null,
            value: { $sum: { $multiply: ["$price", "$stock"] } },
          },
        },
      ]),
      Product.countDocuments(lowStockQuery),
      Product.find(lowStockQuery)
        .sort({ stock: 1, updatedAt: -1 })
        .select("title images sku stock")
        .limit(rowLimit)
        .lean(),
      Order.aggregate([
        { $match: { "items.seller": sellerId, paymentStatus: "completed" } },
        {
          $group: {
            _id: "$user",
            firstOrderAt: { $min: "$createdAt" },
            ordersCount: { $sum: 1 },
            inRangeCount: {
              $sum:
                fromDate && toDate
                  ? {
                      $cond: [
                        {
                          $and: [
                            { $gte: ["$createdAt", fromDate] },
                            { $lte: ["$createdAt", toDate] },
                          ],
                        },
                        1,
                        0,
                      ],
                    }
                  : 1,
            },
          },
        },
        { $match: { inRangeCount: { $gt: 0 } } },
      ]),
    ]);

    const facet = orderFacetResult[0] || {};
    const orderLevel = facet.orderLevel?.[0] || {};
    const itemLevel = facet.itemLevel?.[0] || {};
    const totalRevenue = itemLevel.totalRevenue || 0;
    const productsSold = itemLevel.productsSold || 0;
    const totalOrders = orderLevel.totalOrders || 0;
    const pendingOrders = orderLevel.pendingOrders || 0;

    for (const bucket of facet.chartRevenue || []) {
      if (salesChartMap[bucket._id] !== undefined) {
        salesChartMap[bucket._id] = bucket.revenue;
      }
    }

    const salesChart = Object.keys(salesChartMap)
      .map((date) => ({ date, revenue: salesChartMap[date] }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const productCounts = {};
    for (const p of facet.topProducts || []) {
      const id = String(p._id);
      productCounts[id] = {
        id,
        title: p.title,
        quantity: p.quantity,
        revenue: p.revenue,
      };
    }

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    const topLocations = (facet.locations || []).map((l) => ({
      city: l._id,
      count: l.count,
    }));

    const monthlyGrowth = totalRevenue > 0 ? 12.5 : 0;

    const productsListedRows = productsListedRowsRaw.map((p) => ({
      productId: p._id,
      image: firstProductImage(p.images),
      title: p.title || "—",
      inventory: `${Number(p.stock || 0)} units`,
    }));

    const topRevenueProducts = (facet.productRevenue || []).map((p) => ({
      id: String(p._id),
      title: p.title,
      quantity: p.quantity,
      revenue: p.revenue,
    }));
    const individualOrderRows = [];
    for (const o of recentOrders) {
      const buyer =
        o.user?.firstName || o.user?.lastName
          ? [o.user?.firstName, o.user?.lastName].filter(Boolean).join(" ")
          : o.user?.name || o.user?.email || "—";
      for (const item of o.items || []) {
        if (String(item.seller) !== sellerIdStr) continue;
        individualOrderRows.push({
          orderId: o._id,
          productId: item.product,
          image: "",
          title: item.title || "—",
          unitPrice: Number(item.price || 0),
          unitsPurchased: Number(item.quantity || 0),
          customerName: buyer,
          status: o.orderStatus || "—",
        });
      }
      if (individualOrderRows.length >= rowLimit) break;
    }

    const reviewFacet = reviewFacetResult[0] || {};
    const reviewAgg = reviewFacet.rows || [];
    const totalReviewsCount = reviewFacet.total?.[0]?.count || 0;

    const [
      topRevenueImageById,
      individualOrderImgById,
      viewProdById,
      cartProdById,
      replacementProdById,
      reviewProdById,
    ] = await Promise.all([
      productDocsByIds(topRevenueProducts.map((p) => p.id), "images"),
      productDocsByIds(individualOrderRows.map((r) => r.productId), "images"),
      productDocsByIds(viewAgg.map((r) => r._id)),
      productDocsByIds(cartAgg.map((r) => r.productId)),
      productDocsByIds(replacementsAgg.map((r) => r.productId).filter(Boolean)),
      productDocsByIds(reviewAgg.map((r) => r.productId)),
    ]);

    const totalSalesRows = topRevenueProducts.map((p) => ({
      productId: p.id,
      image: firstProductImage(topRevenueImageById.get(p.id)?.images),
      title: p.title || "—",
      unitPrice:
        Number(p.quantity || 0) > 0
          ? Number(p.revenue || 0) / Number(p.quantity || 1)
          : 0,
      unitsSold: p.quantity || 0,
      totalCost: p.revenue || 0,
    }));

    const individualOrdersRows = individualOrderRows.slice(0, rowLimit).map((r) => ({
      ...r,
      image: firstProductImage(individualOrderImgById.get(String(r.productId))?.images),
    }));

    const bulkOrdersRows = bulkRowsRaw.map((b) => ({
      inquiryId: b._id,
      productId: b.productId?._id,
      image: firstProductImage(b.productId?.images),
      title: b.productId?.title || "—",
      unitPrice: Number(b.productId?.price || 0),
      unitsPurchased: Number(String(b.quantityRequired || "0").replace(/[^\d.]/g, "")) || 0,
      customerName: b.buyerName || "—",
      status: b.status || "—",
    }));

    const storeViewsRows = viewAgg.map((r) => {
      const p = viewProdById.get(String(r._id));
      return {
        productId: r._id,
        image: firstProductImage(p?.images),
        title: p?.title || "—",
        views: r.views || 0,
      };
    });

    const addedToCartRows = cartAgg.map((r) => {
      const p = cartProdById.get(String(r.productId));
      return {
        productId: r.productId,
        image: firstProductImage(p?.images),
        title: p?.title || "—",
        customers: r.customersCount || 0,
      };
    });

    const returnsRows = returnsRowsRaw.map((rr) => ({
      returnId: rr._id,
      productId: rr.product?._id,
      image: firstProductImage(rr.product?.images),
      title: rr.product?.title || "—",
      customersCount: 1,
      status: rr.status || "—",
    }));

    const refundsRows = refundsRowsRaw.map((rr) => ({
      refundId: rr._id,
      productId: rr.product?._id,
      image: firstProductImage(rr.product?.images),
      title: rr.product?.title || "—",
      customersCount: 1,
      refundStatus: rr.refundStatus || "—",
    }));

    const replacementsRows = replacementsAgg.map((r) => {
      const p = replacementProdById.get(String(r.productId));
      return {
        productId: r.productId,
        image: firstProductImage(p?.images),
        title: p?.title || "—",
        customersCount: r.customersCount || 0,
      };
    });

    const reviewsRows = reviewAgg.map((r) => {
      const p = reviewProdById.get(String(r.productId));
      return {
        productId: r.productId,
        image: firstProductImage(p?.images),
        title: p?.title || "—",
        averageReviews: `${Math.round((Number(r.avgRating || 0) / 5) * 10)}/10`,
        customersCount: r.customersCount || 0,
      };
    });

    const averageSaleValueIndividual =
      totalOrders > 0 ? Number(totalRevenue || 0) / Number(totalOrders) : 0;
    const averageSaleRows = totalSalesRows;

    const activeInventoryValueTotal = activeInventoryValue?.[0]?.value || 0;
    const activeProductsRows = activeProductsRowsRaw.map((p) => ({
      productId: p._id,
      image: firstProductImage(p.images),
      title: p.title || "—",
      pricePerUnit: Number(p.price || 0),
      skuUnits: Number(p.stock || 0),
      totalCost: Number(p.price || 0) * Number(p.stock || 0),
    }));

    const inactiveInventoryValueTotal = inactiveInventoryValue?.[0]?.value || 0;
    const inactiveProductsRows = inactiveProductsRowsRaw.map((p) => ({
      productId: p._id,
      image: firstProductImage(p.images),
      title: p.title || "—",
      pricePerUnit: Number(p.price || 0),
      skuUnits: Number(p.stock || 0),
      status: p.approvalStatus === "pending" ? "Under Approval" : p.approvalStatus || "—",
    }));

    const lowStockRows = lowStockRowsRaw.map((p) => ({
      productId: p._id,
      image: firstProductImage(p.images),
      title: p.title || "—",
      sku: p.sku || "—",
      stock: Number(p.stock || 0),
    }));

    const totalCustomers = customerAgg.length;
    const newCustomers =
      fromDate && toDate
        ? customerAgg.filter((c) => c.firstOrderAt >= fromDate && c.firstOrderAt <= toDate).length
        : totalCustomers;
    const repeatCustomers = customerAgg.filter((c) => Number(c.ordersCount || 0) > 1).length;

    // Total customers (table) — per screenshot rows are product sales summary
    const totalCustomersTable = {
      total: totalCustomers,
      rows: totalSalesRows,
    };

    const payload = {
      range: {
        preset,
        from: fromDate ? formatYmdUtc(fromDate) : null,
        to: toDate ? formatYmdUtc(toDate) : null,
        chartBucket: useMonthlyChart ? "month" : "day",
      },
      plan: req.user.subscriptionPlan || (isPremium ? "premium" : "free"),
      totalRevenue,
      totalOrders,
      productsSold,
      pendingOrders,
      monthlyGrowth,
      salesChart,
      topProducts,
      topLocations,
      performanceOverview: {
        productsListed: {
          total: productsListedTotal,
          rows: productsListedRows,
        },
        totalSales: {
          total: totalRevenue,
          rows: totalSalesRows,
        },
        individualOrders: {
          total: totalOrders,
          rows: individualOrdersRows,
        },
        bulkOrders: {
          total: bulkTotal,
          rows: bulkOrdersRows,
        },
        storeViews: {
          total: viewsTotal,
          rows: storeViewsRows,
        },
        addedToCart: {
          total: cartAddsTotal,
          rows: addedToCartRows,
        },
        returns: {
          total: returnsTotal,
          rows: returnsRows,
        },
        refunds: {
          total: refundsTotal,
          rows: refundsRows,
        },
        replacements: {
          total: replacementsTotal,
          rows: replacementsRows,
        },
        reviews: {
          total: totalReviewsCount,
          rows: reviewsRows,
        },
        averageSaleValueIndividual: {
          total: averageSaleValueIndividual,
          rows: averageSaleRows,
        },
        activeProducts: {
          total: activeProductsTotal,
          inventoryValue: activeInventoryValueTotal,
          rows: activeProductsRows,
        },
        inactiveProducts: {
          total: inactiveProductsTotal,
          inventoryValue: inactiveInventoryValueTotal,
          rows: inactiveProductsRows,
        },
        lowStockProducts: {
          threshold: lowStockThreshold,
          total: lowStockTotal,
          rows: lowStockRows,
        },
        totalCustomersTable,
        customers: {
          totalCustomers,
          newCustomers,
          repeatCustomers,
        },
      },
    };

    setCachedAnalytics(cacheKey, payload, 120_000);

    res.status(200).json({
      success: true,
      data: payload,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
};

// ===============================
// Helper: Auto check and handle subscription expiry
// ===============================
export const checkAndHandleSubscriptionExpiry = async (user) => {
  if (
    user &&
    user.sellerType === "premium" &&
    user.subscriptionActive &&
    user.subscriptionValidUntil &&
    new Date(user.subscriptionValidUntil) <= new Date()
  ) {
    user.subscriptionActive = false;
    user.bulkPurchaseEnabled = false;
    await user.save();
  }
};

// ===============================
// 👤 GET SELLER PROFILE
// ===============================
export const getSellerProfile = async (req, res) => {
  try {
    const user = req.user;
    await checkAndHandleSubscriptionExpiry(user);
    const isPremium = user.sellerType === "premium" && user.subscriptionActive === true;

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      businessName: user.businessName,
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      entityTypeOther: user.entityTypeOther,
      storeAddresses: user.storeAddresses,
      dateOfRegistration: user.dateOfRegistration,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      isHyperlocal: user.isHyperlocal,
      deliverablePincodes: user.deliverablePincodes,
      status: user.status,
      kycStatus: user.kycStatus,
      sellerType: user.sellerType,
      subscriptionActive: user.subscriptionActive,
      subscriptionPlan: user.subscriptionPlan || (user.sellerType === "premium" && user.subscriptionActive ? "premium" : "free"),
      subscriptionValidUntil: user.subscriptionValidUntil || null,
      plan: user.subscriptionPlan === "premium" ? "Premium" : user.subscriptionPlan === "pro" ? "Pro" : "Free",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 VIEW KYC DOCUMENT (opens in new tab)
// ===============================
const KYC_DOC_FIELDS = new Set([
  "registrationCertificate",
  "orgPanImage",
  "gstImage",
  "cancelledCheckImage",
]);

export const getKycDocumentUrl = async (req, res) => {
  try {
    const user = req.user;
    const { field } = req.params;

    if (!KYC_DOC_FIELDS.has(field)) {
      return res.status(400).json({ message: "Invalid document field." });
    }

    const docPath = user[field];
    if (!docPath) {
      return res.status(404).json({ message: "No document uploaded for this field." });
    }

    // Return the document URL for frontend to open in new tab
    res.json({
      field,
      url: docPath,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET SELLER PRODUCTS
// ===============================
export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE SELLER PROFILE
// ===============================
export const updateSellerProfile = async (req, res) => {
  try {
    const user = req.user;

    const {
      firstName,
      lastName,
      mobile,
      businessName,
      address,
      city,
      state,
      pincode,
      isHyperlocal,
      deliverablePincodes
    } = req.body;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.mobile = mobile || user.mobile;
    user.businessName = businessName || user.businessName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.pincode = pincode || user.pincode;
    
    if (isHyperlocal !== undefined) {
      user.isHyperlocal = isHyperlocal;
    }
    
    if (deliverablePincodes !== undefined) {
      // If it's a string from a comma-separated list, split it
      if (typeof deliverablePincodes === 'string') {
        user.deliverablePincodes = deliverablePincodes.split(',').map(p => p.trim()).filter(Boolean);
      } else if (Array.isArray(deliverablePincodes)) {
        user.deliverablePincodes = deliverablePincodes;
      }
    }

    await user.save();

    res.json({
      message:
        req.method === "PATCH"
          ? "Profile auto-saved"
          : "Profile updated successfully",
      autoSaved: req.method === "PATCH",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔑 CHANGE SELLER PASSWORD
// ===============================
export const changeSellerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    // Fetch seller with password field (req.user has -password selected)
    const sellerDoc = await Seller.findById(req.user._id);

    if (!sellerDoc) {
      return res.status(404).json({ message: "Seller not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, sellerDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    sellerDoc.password = await bcrypt.hash(newPassword, 10);
    await sellerDoc.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📋 INVENTORY FIELD OPTIONS (purchase type rules, store addresses)
// ===============================
export const getProductInventoryOptions = async (req, res) => {
  try {
    const user = req.user;
    const storeAddresses = (user.storeAddresses || [])
      .map((a) => String(a).trim())
      .filter(Boolean);
    const subscribed = isSubscribedSeller(user);
    const categoryLimits = await getSellerCategoryLimitsForApi(user);

    res.json({
      purchaseTypeOptions: getPurchaseTypeOptionsForSeller(user),
      storeAddresses,
      maxStoreAddresses: subscribed ? Math.max(storeAddresses.length, 1) : 1,
      maxOrderQuantityLimit: getMaxOrderQuantityLimit(user),
      isSubscribedSeller: subscribed,
      storeAddressHint: subscribed
        ? "Select one or multiple store addresses to ship product from."
        : "Only one store address allowed for free users.",
      categoryLimits,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 GET PRODUCT DRAFT (auto-save restore)
// ===============================
export const getProductDraft = async (req, res) => {
  try {
    const draft = await Product.findOne({
      sellerId: req.user._id,
      isDraft: true,
    }).sort({ updatedAt: -1 });

    res.json({ draft: draft || null });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 SUBMIT KYC
// ===============================
export const submitKYC = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { panNumber, aadhaarNumber } = req.body;

    if (!panNumber || !aadhaarNumber) {
      return res.status(400).json({
        message: "PAN and Aadhaar are required",
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        message: "Upload PAN and Aadhaar images",
      });
    }

    const panImage = absoluteToWebPath(req.files[0].path);
    const aadhaarImage = absoluteToWebPath(req.files[1].path);

    user.panNumber = panNumber;
    user.aadhaarNumber = aadhaarNumber;
    user.panImage = panImage;
    user.aadhaarImage = aadhaarImage;

    user.kycStatus = "pending";
    user.status = "kyc_submitted";

    await user.save();

    res.json({
      message: "KYC submitted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 1 (Organization Details)
// ===============================
export const submitKycStep1 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { elevatorPitch, officialName, entityType, entityTypeOther } = req.body;

    const entityCheck = await validateSellerEntityType(entityType, entityTypeOther);
    if (!entityCheck.ok) {
      return res.status(400).json({ message: entityCheck.message });
    }
    
    // Logo is optional during this step, but typically required
    let organizationLogo = user.organizationLogo;
    if (req.file) {
      organizationLogo = absoluteToWebPath(req.file.path);
    }

    // Update user details
    user.elevatorPitch = elevatorPitch || user.elevatorPitch;
    user.officialName = officialName || user.officialName;
    user.entityType = entityCheck.row.code;
    user.entityTypeOther = entityCheck.row.requiresOtherText
      ? String(entityTypeOther || "").trim()
      : "";

    // storeAddresses can come as either:
    // - storeAddresses (string or array)
    // - storeAddresses[] (string or array) from some formData implementations
    const storeAddressesRaw = req.body.storeAddresses ?? req.body["storeAddresses[]"];
    if (storeAddressesRaw !== undefined) {
      const parsedStoreAddresses = (Array.isArray(storeAddressesRaw)
        ? storeAddressesRaw
        : [storeAddressesRaw])
        .map((a) => String(a).trim())
        .filter(Boolean);

      const subscribed = isSubscribedSeller(user);
      if (!subscribed && parsedStoreAddresses.length > 1) {
        return res.status(403).json({
          message:
            "Only one store address allowed for free users. Upgrade to Pro or Premium to add more addresses.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "multiple_addresses",
        });
      }

      user.storeAddresses = subscribed ? parsedStoreAddresses : parsedStoreAddresses.slice(0, 1);
    }
    
    user.organizationLogo = organizationLogo;

    // Optional: we could change user.kycStatus = "step1_completed" or keep it as is
    // Let's just save the updated info for now
    await user.save();

    if (req.method !== "PATCH") {
      logKycActivity(user._id, "Saved KYC organization details");
    }

    res.json({
      message:
        req.method === "PATCH"
          ? "Organization details auto-saved"
          : "Organization details saved successfully",
      autoSaved: req.method === "PATCH",
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      entityTypeOther: user.entityTypeOther,
      storeAddresses: user.storeAddresses,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 2 (Business Documents)
// ===============================
export const submitKycStep2 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { dateOfRegistration, registrationNumber, orgPanNumber, gstNumber, agreedToTerms } =
      req.body;

    user.dateOfRegistration = dateOfRegistration || user.dateOfRegistration;
    user.registrationNumber = registrationNumber || user.registrationNumber;

    // PAN validation (compulsory, max 10 alphanumeric)
    if (orgPanNumber !== undefined && String(orgPanNumber || "").trim()) {
      const panCheck = validatePanNumber(orgPanNumber);
      if (!panCheck.valid) {
        return res.status(400).json({ message: panCheck.message });
      }
      user.orgPanNumber = String(orgPanNumber).trim().toUpperCase();
    } else {
      user.orgPanNumber = orgPanNumber || user.orgPanNumber;
    }

    // GST validation (optional, max 15 alphanumeric — only validated if provided)
    if (gstNumber !== undefined) {
      const trimmedGst = String(gstNumber || "").trim();
      if (trimmedGst) {
        const gstCheck = validateGstNumber(trimmedGst);
        if (!gstCheck.valid) {
          return res.status(400).json({ message: gstCheck.message });
        }
        user.gstNumber = trimmedGst.toUpperCase();
      } else {
        user.gstNumber = "";
      }
    }
    
    if (agreedToTerms !== undefined) {
      user.agreedToTerms = agreedToTerms === 'true' || agreedToTerms === true;
    }

    // Update files if provided
    if (req.files) {
      if (req.files.registrationCertificate && req.files.registrationCertificate[0]) {
        user.registrationCertificate = absoluteToWebPath(req.files.registrationCertificate[0].path);
      }
      if (req.files.orgPanImage && req.files.orgPanImage[0]) {
        user.orgPanImage = absoluteToWebPath(req.files.orgPanImage[0].path);
      }
      if (req.files.cancelledCheckImage && req.files.cancelledCheckImage[0]) {
        user.cancelledCheckImage = absoluteToWebPath(req.files.cancelledCheckImage[0].path);
      }
      if (req.files.gstImage && req.files.gstImage[0]) {
        user.gstImage = absoluteToWebPath(req.files.gstImage[0].path);
      }
    }

    await user.save();

    if (req.method !== "PATCH") {
      logKycActivity(user._id, "Saved KYC business documents");
    }

    res.json({
      message:
        req.method === "PATCH"
          ? "Business documents auto-saved"
          : "Business documents saved successfully",
      autoSaved: req.method === "PATCH",
      dateOfRegistration: user.dateOfRegistration,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ SUBMIT KYC (single page — all fields + documents)
// ===============================
export const submitKycComplete = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can submit KYC" });
    }

    const isAutosave = req.method === "PATCH";
    const {
      elevatorPitch,
      officialName,
      entityType,
      entityTypeOther,
      dateOfRegistration,
      registrationNumber,
      orgPanNumber,
      gstNumber,
      agreedToTerms,
    } = req.body;

    if (isAutosave) {
      if (entityType !== undefined && String(entityType).trim()) {
        const entityCheck = await validateSellerEntityType(entityType, entityTypeOther);
        if (!entityCheck.ok) {
          return res.status(400).json({ message: entityCheck.message });
        }
        user.entityType = entityCheck.row.code;
        user.entityTypeOther = entityCheck.row.requiresOtherText
          ? String(entityTypeOther || "").trim()
          : "";
      }

      if (elevatorPitch !== undefined) {
        user.elevatorPitch = String(elevatorPitch || "").trim();
      }
      if (officialName !== undefined) {
        user.officialName = String(officialName || "").trim();
      }
      if (dateOfRegistration !== undefined) {
        user.dateOfRegistration = dateOfRegistration || user.dateOfRegistration;
      }
      if (registrationNumber !== undefined) {
        user.registrationNumber = String(registrationNumber || "").trim();
      }
      if (orgPanNumber !== undefined) {
        const panStr = String(orgPanNumber || "").trim();
        if (panStr) {
          const panCheck = validatePanNumber(panStr);
          if (!panCheck.valid) {
            return res.status(400).json({ message: panCheck.message });
          }
          user.orgPanNumber = panStr.toUpperCase();
        } else {
          user.orgPanNumber = panStr;
        }
      }
      if (gstNumber !== undefined) {
        const gstStr = String(gstNumber || "").trim();
        if (gstStr) {
          const gstCheck = validateGstNumber(gstStr);
          if (!gstCheck.valid) {
            return res.status(400).json({ message: gstCheck.message });
          }
          user.gstNumber = gstStr.toUpperCase();
        } else {
          user.gstNumber = gstStr;
        }
      }
      if (agreedToTerms !== undefined) {
        user.agreedToTerms = agreedToTerms === "true" || agreedToTerms === true;
      }

      const storeAddressesRaw = req.body.storeAddresses ?? req.body["storeAddresses[]"];
      if (storeAddressesRaw !== undefined) {
        const parsedStoreAddresses = (Array.isArray(storeAddressesRaw)
          ? storeAddressesRaw
          : [storeAddressesRaw])
          .map((a) => String(a).trim())
          .filter(Boolean);

        const subscribed = isSubscribedSeller(user);
        if (!subscribed && parsedStoreAddresses.length > 1) {
          return res.status(403).json({
            message:
              "Only one store address allowed for free users. Upgrade to Pro or Premium to add more addresses.",
            code: "PREMIUM_REQUIRED",
            upgradeFeature: "multiple_addresses",
          });
        }
        user.storeAddresses = subscribed
          ? parsedStoreAddresses
          : parsedStoreAddresses.slice(0, 1);
      }

      if (req.files?.logo?.[0]) {
        assertKycLogoUpload(req.files.logo[0]);
        user.organizationLogo = absoluteToWebPath(req.files.logo[0].path);
      }

      const docChecks = [
        ["registrationCertificate", "Registration Certificate", assertKycCertificateUpload],
        ["orgPanImage", "PAN Document", assertKycImageUpload],
        ["gstImage", "GST Document", assertKycImageUpload],
      ];

      for (const [field, , assertFn] of docChecks) {
        const uploaded = req.files?.[field]?.[0];
        if (uploaded) {
          assertFn(uploaded, field);
          user[field] = absoluteToWebPath(uploaded.path);
        }
      }

      await user.save();

      return res.json({
        message: "KYC progress auto-saved",
        autoSaved: true,
        organizationLogo: user.organizationLogo,
        registrationCertificate: user.registrationCertificate,
        orgPanImage: user.orgPanImage,
        gstImage: user.gstImage,
      });
    }

    const entityCheck = await validateSellerEntityType(entityType, entityTypeOther);
    if (!entityCheck.ok) {
      return res.status(400).json({ message: entityCheck.message });
    }

    if (agreedToTerms !== "true" && agreedToTerms !== true) {
      return res.status(400).json({
        message: "You must agree to the Terms and Conditions to submit KYC.",
      });
    }

    user.elevatorPitch = String(elevatorPitch || "").trim();
    user.officialName = String(officialName || "").trim();
    user.entityType = entityCheck.row.code;
    user.entityTypeOther = entityCheck.row.requiresOtherText
      ? String(entityTypeOther || "").trim()
      : "";
    user.dateOfRegistration = dateOfRegistration || user.dateOfRegistration;
    user.registrationNumber = String(registrationNumber || "").trim();

    // PAN validation (compulsory)
    const panStr = String(orgPanNumber || "").trim();
    if (!panStr) {
      return res.status(400).json({ message: "PAN number is required." });
    }
    const panCheck = validatePanNumber(panStr);
    if (!panCheck.valid) {
      return res.status(400).json({ message: panCheck.message });
    }
    user.orgPanNumber = panStr.toUpperCase();

    // GST validation (optional — only validated if provided)
    const gstStr = String(gstNumber || "").trim();
    if (gstStr) {
      const gstCheck = validateGstNumber(gstStr);
      if (!gstCheck.valid) {
        return res.status(400).json({ message: gstCheck.message });
      }
      user.gstNumber = gstStr.toUpperCase();
    } else {
      user.gstNumber = "";
    }
    user.agreedToTerms = true;

    const storeAddressesRaw = req.body.storeAddresses ?? req.body["storeAddresses[]"];
    if (storeAddressesRaw !== undefined) {
      const parsedStoreAddresses = (Array.isArray(storeAddressesRaw)
        ? storeAddressesRaw
        : [storeAddressesRaw])
        .map((a) => String(a).trim())
        .filter(Boolean);

      const subscribed = isSubscribedSeller(user);
      if (!subscribed && parsedStoreAddresses.length > 1) {
        return res.status(403).json({
          message:
            "Only one store address allowed for free users. Upgrade to Pro or Premium to add more addresses.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "multiple_addresses",
        });
      }
      user.storeAddresses = subscribed ? parsedStoreAddresses : parsedStoreAddresses.slice(0, 1);
    }

    if (req.files?.logo?.[0]) {
      assertKycLogoUpload(req.files.logo[0]);
      user.organizationLogo = absoluteToWebPath(req.files.logo[0].path);
    } else if (!user.organizationLogo) {
      return res.status(400).json({ message: "Organization logo is required (PNG or JPG)." });
    }

    // Required documents: Registration Certificate and PAN Document
    const requiredDocChecks = [
      ["registrationCertificate", "Registration Certificate", assertKycCertificateUpload],
      ["orgPanImage", "PAN Document", assertKycImageUpload],
    ];

    for (const [field, label, assertFn] of requiredDocChecks) {
      const uploaded = req.files?.[field]?.[0];
      if (uploaded) {
        assertFn(uploaded, label);
        user[field] = absoluteToWebPath(uploaded.path);
      } else if (!user[field]) {
        return res.status(400).json({ message: `${label} is required.` });
      }
    }

    // Optional document: GST Document (only validated if uploaded, but compulsory if GST number is provided)
    const gstImageUploaded = req.files?.["gstImage"]?.[0];
    if (gstImageUploaded) {
      assertKycImageUpload(gstImageUploaded, "GST Document");
      user.gstImage = absoluteToWebPath(gstImageUploaded.path);
    } else if (user.gstNumber?.trim() && !user.gstImage) {
      return res.status(400).json({ message: "GST Document is required when GST number is provided." });
    }

    const missingFields = getKycMissingFields(user);
    if (!entityCheck.ok) {
      missingFields.push("entityType");
    }
    if (entityCheck.row.requiresOtherText && !user.entityTypeOther?.trim()) {
      missingFields.push("entityTypeOther");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please fill all required fields before submitting.",
        missingFields,
      });
    }

    user.kycStatus = "pending";
    user.status = "kyc_submitted";
    await user.save();

    logKycActivity(user._id, "Submitted KYC for admin verification");

    res.json({
      message: "KYC submitted successfully for verification!",
      kycStatus: user.kycStatus,
      status: user.status,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// ===============================
// ✅ FINALIZE KYC (Submit for Verification)
// ===============================
export const finalizeKyc = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can submit KYC" });
    }

    // Check required fields
    const entityCheck = await validateSellerEntityType(
      user.entityType,
      user.entityTypeOther
    );

    const missingFields = getKycMissingFields(user);
    if (!entityCheck.ok) {
      missingFields.push("entityType");
    }
    if (entityCheck.row?.requiresOtherText && !user.entityTypeOther?.trim()) {
      missingFields.push("entityTypeOther");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please fill all required fields before submitting.",
        missingFields,
      });
    }

    // If everything is valid, update statuses
    user.kycStatus = "pending"; // Pending admin approval
    user.status = "kyc_submitted";

    await user.save();

    logKycActivity(user._id, "Submitted KYC for admin verification");

    res.json({
      message: "KYC submitted successfully for verification!",
      kycStatus: user.kycStatus,
      status: user.status,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 💎 CREATE SUBSCRIPTION ORDER (Razorpay)
// ===============================
export const createSubscriptionOrder = async (req, res) => {
  try {
    const user = await Seller.findById(req.user._id);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can subscribe." });
    }

    const plan = req.body.plan || "pro";
    if (!["pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan selection. Choose either pro or premium." });
    }

    const activePlan = user.subscriptionPlan || (user.sellerType === "premium" && user.subscriptionActive === true ? "premium" : "free");
    if (activePlan === "premium" || activePlan === plan) {
      return res.status(400).json({ message: "You are already subscribed to this or a higher plan." });
    }

    let rzp;
    try {
      rzp = getRazorpayOrThrow();
    } catch (e) {
      return res.status(e.statusCode || 503).json({ message: e.message });
    }

    let amount;
    if (plan === "premium") {
      amount = 23364000; // ₹1,98,000 + 18% GST in paise = ₹2,33,640.00
    } else {
      amount = 1076750; // ₹9,125 + 18% GST in paise = ₹10,767.50
    }

    const voucherCode = req.body.voucherCode;
    if (voucherCode) {
      const result = await validateUpgradeVoucher(voucherCode, plan, user._id);
      amount = Math.round(result.finalAmount * 100); // convert final amount (Rs) to paise
    }

    const receipt = `sub_${user._id.toString().slice(-8)}_${Date.now()}`.slice(0, 40);

    const order = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        purpose: "premium_seller_subscription",
        sellerId: user._id.toString(),
        plan: plan,
        voucherCode: voucherCode || "",
      },
    });

    if (!order?.id) {
      return res.status(502).json({ message: "Could not create payment order. Try again." });
    }

    user.pendingPremiumOrderId = order.id;
    user.pendingPremiumOrderAt = new Date();
    await user.save();

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      refundable: false,
      refundPolicy: "Non-refundable",
    });
  } catch (error) {
    console.error("[seller] createSubscriptionOrder:", error?.message || error);
    res.status(500).json({
      message: error?.error?.description || error?.message || "Failed to create Razorpay order",
    });
  }
};

// ===============================
// 💎 VERIFY SUBSCRIPTION PAYMENT (Razorpay)
// ===============================
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: "Missing required Razorpay parameters." });
    }

    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeCompareHex(generated, razorpaySignature)) {
      return res.status(400).json({ message: "Payment signature mismatch. Tampering detected." });
    }

    let rzp;
    try {
      rzp = getRazorpayOrThrow();
    } catch (e) {
      return res.status(e.statusCode || 503).json({ message: e.message });
    }

    const payment = await rzp.payments.fetch(razorpayPaymentId);

    if (!payment.order_id || payment.order_id !== razorpayOrderId) {
      return res.status(400).json({ message: "Payment does not match this order." });
    }

    if (payment.status !== "captured") {
      return res
        .status(400)
        .json({ message: `Payment is not captured yet (status: ${payment.status}).` });
    }

    let order;
    try {
      order = await rzp.orders.fetch(razorpayOrderId);
    } catch {
      return res.status(400).json({ message: "Invalid or expired order id." });
    }

    const notePlan = order?.notes?.plan || "pro";
    const voucherCode = order?.notes?.voucherCode;

    let originalAmount = notePlan === "premium" ? 233640.00 : 10767.50;
    let expectedAmount = notePlan === "premium" ? 23364000 : 1076750;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let voucher = null;

    if (voucherCode) {
      const result = await validateUpgradeVoucher(voucherCode, notePlan, req.user._id);
      discountAmount = result.discountAmount;
      finalAmount = result.finalAmount;
      expectedAmount = Math.round(result.finalAmount * 100);
      voucher = await AdminVoucher.findOne({ voucherCode: result.voucherCode });
    }

    if (Number(order.amount) !== expectedAmount) {
      return res.status(400).json({ message: "Order amount does not match the subscription price." });
    }

    const noteSellerId = order?.notes?.sellerId ?? order?.notes?.seller_id;
    if (!noteSellerId || String(noteSellerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "This order does not belong to your seller account." });
    }

    const user = await Seller.findById(req.user._id);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can activate premium." });
    }

    if (
      user.premiumLastPaymentId === razorpayPaymentId &&
      user.sellerType === "premium" &&
      user.subscriptionActive &&
      user.subscriptionPlan === notePlan
    ) {
      return res.json({
        message: "Premium is already active on your account.",
        sellerType: user.sellerType,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionValidUntil: user.subscriptionValidUntil,
        bulkPurchaseEnabled: user.bulkPurchaseEnabled,
        subscriptionActive: user.subscriptionActive,
      });
    }

    const paidAmount = Number(payment.amount);
    if (Number.isFinite(paidAmount) && paidAmount !== expectedAmount) {
      return res.status(400).json({ message: "Paid amount does not match the subscription price." });
    }

    const wasAlreadyPremium =
      user.sellerType === "premium" && user.subscriptionActive === true;

    user.sellerType = "premium";
    user.subscriptionPlan = notePlan;
    
    let validUntil = new Date();
    if (user.subscriptionValidUntil && user.subscriptionValidUntil > new Date() && user.subscriptionActive) {
      validUntil = new Date(user.subscriptionValidUntil);
    }
    validUntil.setDate(validUntil.getDate() + 365);
    user.subscriptionValidUntil = validUntil;

    user.bulkPurchaseEnabled = true;
    user.subscriptionActive = true;
    user.pendingPremiumOrderId = null;
    user.pendingPremiumOrderAt = null;
    user.premiumLastPaymentId = razorpayPaymentId;

    await user.save();

    if (voucher) {
      voucher.usedCount = (voucher.usedCount || 0) + 1;
      await voucher.save();

      await VoucherUsage.create({
        voucherId: voucher._id,
        voucherCode: voucher.voucherCode,
        voucherModel: "AdminVoucher",
        userId: user._id,
        discountAmount,
        originalAmount,
        finalAmount,
      });
    }

    sendPremiumUpgradeEmail(user).catch((e) =>
      console.error("Premium upgrade email failed:", e?.message || e)
    );
    if (!wasAlreadyPremium) {
      logPremiumActivity(user._id);
    }

    return res.json({
      message: "Premium Activated Successfully",
      sellerType: user.sellerType,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidUntil: user.subscriptionValidUntil,
      bulkPurchaseEnabled: user.bulkPurchaseEnabled,
      subscriptionActive: user.subscriptionActive,
      refundable: false,
      refundPolicy: "Non-refundable",
    });
  } catch (error) {
    console.error("[seller] verifySubscriptionPayment:", error?.message || error);
    res.status(500).json({
      message: error?.error?.description || error?.message || "Verification failed",
    });
  }
};

// ===============================
// 💎 MANUAL PREMIUM UPGRADE (no payment)
// ===============================
export const upgradeSellerToPremiumManual = async (req, res) => {
  try {
    const user = req.user;
    const plan = req.body.plan || "pro";
    const voucherCode = req.body.voucherCode;

    let originalAmount = plan === "premium" ? 233640.00 : 10767.50;
    let discountAmount = 0;
    let finalAmount = originalAmount;
    let voucher = null;

    if (voucherCode) {
      const result = await validateUpgradeVoucher(voucherCode, plan, user._id);
      discountAmount = result.discountAmount;
      finalAmount = result.finalAmount;
      voucher = await AdminVoucher.findOne({ voucherCode: result.voucherCode });
    }

    const already =
      user.sellerType === "premium" &&
      user.subscriptionActive === true &&
      user.subscriptionPlan === plan;

    user.sellerType = "premium";
    user.subscriptionPlan = plan;
    
    let validUntil = new Date();
    if (user.subscriptionValidUntil && user.subscriptionValidUntil > new Date() && user.subscriptionActive) {
      validUntil = new Date(user.subscriptionValidUntil);
    }
    validUntil.setDate(validUntil.getDate() + 365);
    user.subscriptionValidUntil = validUntil;

    user.bulkPurchaseEnabled = true;
    user.subscriptionActive = true;
    user.pendingPremiumOrderId = null;
    user.pendingPremiumOrderAt = null;
    await user.save();

    if (voucher) {
      voucher.usedCount = (voucher.usedCount || 0) + 1;
      await voucher.save();

      await VoucherUsage.create({
        voucherId: voucher._id,
        voucherCode: voucher.voucherCode,
        voucherModel: "AdminVoucher",
        userId: user._id,
        discountAmount,
        originalAmount,
        finalAmount,
      });
    }
    
    sendPremiumUpgradeEmail(user).catch((e) =>
      console.log("Premium upgrade email failed:", e.message)
    );
    logPremiumActivity(user._id);
    return res.json({
      message: voucher
        ? `Voucher Applied Successfully. No Payment Required.`
        : already
        ? `Premium (${plan}) is already active on your account.`
        : `Premium (${plan}) Activated Successfully (no payment)`,
      sellerType: user.sellerType,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidUntil: user.subscriptionValidUntil,
      bulkPurchaseEnabled: user.bulkPurchaseEnabled,
      subscriptionActive: user.subscriptionActive,
      refundable: false,
      refundPolicy: "Non-refundable",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 💎 GET PREMIUM PAGE DETAILS (stats, plan details)
// ===============================
export const getPremiumPageDetails = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user._id);
    const user = await Seller.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "Seller not found" });
    }

    await checkAndHandleSubscriptionExpiry(user);

    // 1. Products Listed
    const productsListed = await Product.countDocuments({ sellerId, isActive: true });

    // 2. Individual Customers
    const individualCustomers = await Order.distinct("user", {
      "items.seller": sellerId,
      paymentStatus: "completed"
    }).then(users => users.length);

    // 3. Bulk Orders
    const bulkOrders = await BulkInquiry.countDocuments({ sellerId });

    // 4. Total Referrals & Referral Rewards
    let totalReferrals = 0;
    let totalReferralRewards = 0;
    try {
      const referralStats = await getReferralStatsForSeller(sellerId, user);
      totalReferrals = referralStats.referralSignups || 0;
      totalReferralRewards = referralStats.creditsEarned || 0;
    } catch (err) {
      console.error("Failed to fetch referral stats for premium details:", err);
    }

    // 5. Total Sales
    const salesAgg = await Order.aggregate([
      { $match: { "items.seller": sellerId, paymentStatus: "completed" } },
      { $unwind: "$items" },
      { $match: { "items.seller": sellerId } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
        }
      }
    ]);
    const totalSales = salesAgg[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        sellerType: user.sellerType,
        subscriptionActive: user.subscriptionActive,
        subscriptionPlan: user.subscriptionPlan || (user.sellerType === "premium" && user.subscriptionActive ? "premium" : "free"),
        subscriptionValidUntil: user.subscriptionValidUntil || null,
        stats: {
          productsListed,
          individualCustomers,
          bulkOrders,
          totalReferrals,
          totalSales,
          totalReferralRewards
        }
      }
    });

  } catch (error) {
    console.error("[seller] getPremiumPageDetails error:", error);
    res.status(500).json({ message: "Failed to fetch premium page details" });
  }
};

// ===============================
// 📋 RECENT ACTIVITY
// ===============================
export const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit || "20"), 10) || 20, 200);
    const activities = await getRecentSellerActivities(req.user._id, limit);
    res.status(200).json({
      message: "Recent activity fetched successfully",
      count: activities.length,
      activities,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch recent activity" });
  }
};

// ===============================
// 🤝 REFER AND EARN
// ===============================
export const getReferAndEarn = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const referralCode = await ensureSellerReferralCode(user);
    const frontendBase = sellerPortalBaseUrl(req);
    const deviceType = req.clientDevice || "desktop";
    const referredLimit = capListLimit(deviceType, req.query?.referredLimit, {
      mobile: 15,
      tablet: 30,
      desktop: 100,
    });
    const stats = await getReferralStatsForSeller(user._id, user, {
      limit: referredLimit,
    });
    const isPremium = user.sellerType === "premium" && user.subscriptionActive === true;
    const activePlan = user.subscriptionPlan || (isPremium ? "premium" : "free");
    const currentPlanLabel = activePlan === "premium" ? "Premium" : activePlan === "pro" ? "Pro" : "Free";
    const senderName =
      user.businessName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "Seller";

    res.status(200).json({
      message: "Refer and earn fetched successfully",
      data: {
        program: SELLER_REFER_PROGRAM,
        planRows: SELLER_REFER_PLAN_ROWS,
        referralCode,
        referralLink: sellerRegisterUrl(frontendBase, referralCode),
        currentPlan: currentPlanLabel,
        senderName,
        stats,
        meta: {
          clientDevice: deviceType,
          referredLimit,
        },
      },
    });
  } catch (error) {
    console.error("[seller] getReferAndEarn:", error?.message || error);
    res.status(500).json({ message: "Failed to load refer and earn" });
  }
};

export const sendReferralInvite = async (req, res) => {
  try {
    const {
      inviteeEmail,
      inviteeFirstName,
      inviteeLastName,
      inviteeVenture,
      inviteeType,
      inviteeContact,
      inviteeDesignation,
    } = req.body || {};

    const rawEmail = typeof inviteeEmail === "string" ? inviteeEmail : "";
    const email = rawEmail.trim().toLowerCase();
    const firstName =
      typeof inviteeFirstName === "string" ? inviteeFirstName.trim() : "";
    const lastName =
      typeof inviteeLastName === "string" ? inviteeLastName.trim() : "";
    const venture =
      typeof inviteeVenture === "string" && inviteeVenture.trim()
        ? inviteeVenture.trim()
        : "your business";
    const inviteeTypeNorm =
      typeof inviteeType === "string" && inviteeType.trim()
        ? inviteeType.trim()
        : null;
    const contact =
      typeof inviteeContact === "string" ? inviteeContact.trim() : "";
    const designation =
      typeof inviteeDesignation === "string" ? inviteeDesignation.trim() : "";

    if (!email || !firstName) {
      return res.status(400).json({
        message: "Please enter a valid email",
      });
    }

    // 1. Check for spaces in the email (before trimming/lowercasing)
    const hasSpace = rawEmail.includes(" ") || /\s/.test(rawEmail);
    // 2. Check for incomplete email format (e.g. .com is missing or invalid domain suffix)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    const isValidFormat = emailRegex.test(rawEmail);

    if (hasSpace || !isValidFormat) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // 3. If any email has been sent to this address earlier
    const emailSentEarlier = await EmailLog.exists({ to: email });
    if (emailSentEarlier) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    // 4. If a user with this email already exists
    const userExists = await User.exists({ email });
    if (userExists) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = req.user;
    if (!user || user.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    const referralCode = await ensureSellerReferralCode(user);
    const referralLink = sellerRegisterUrl(sellerPortalBaseUrl(req), referralCode);
    const senderName =
      user.businessName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      "Aashansh Seller";

    await sendSellerReferralInviteEmail({
      to: email,
      inviteeFirstName: firstName,
      inviteeLastName: lastName,
      inviteeVenture: venture,
      inviteeType: inviteeTypeNorm,
      inviteeContact: contact,
      inviteeDesignation: designation,
      senderName,
      sellerFirstName: user.firstName || "Aashansh Seller",
      referralLink,
      referrerId: user._id,
    });

    // Create the ReferralInvite tracking record
    await ReferralInvite.create({
      referrerId: user._id,
      inviteeEmail: email,
      inviteeFirstName: firstName,
      inviteeLastName: lastName,
      inviteeVenture: venture,
      inviteeContact: contact,
      inviteeDesignation: designation,
      inviteeType: inviteeTypeNorm || "",
      status: "sent",
      followUpCount: 0,
      lastFollowUpSentAt: new Date(),
    }).catch((err) => {
      console.error("[seller] Failed to create ReferralInvite record:", err.message);
    });

    res.status(200).json({
      message: "Invitation email sent successfully",
      data: { inviteeEmail: email },
    });
  } catch (error) {
    console.error("[seller] sendReferralInvite:", error?.message || error);
    res.status(500).json({
      message: error.message || "Failed to send invitation email",
    });
  }
};

// ===============================
// ℹ️ ABOUT US (seller hub)
// ===============================
export const getAboutUs = async (req, res) => {
  try {
    res.status(200).json({
      message: "About us fetched successfully",
      data: SELLER_ABOUT_US,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to load about us" });
  }
};

// ===============================
// 🧪 TESTING ROUTES FOR SUBSCRIPTION
// ===============================
export const setSubscriptionDaysForTest = async (req, res) => {
  try {
    const { daysLeft } = req.body;
    if (daysLeft === undefined) {
      return res.status(400).json({ message: "Missing daysLeft in request body" });
    }

    const user = await Seller.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + Number(daysLeft));
    user.subscriptionValidUntil = validUntil;
    user.sellerType = "premium";
    user.subscriptionPlan = "premium";
    user.subscriptionActive = Number(daysLeft) > 0;
    if (Number(daysLeft) > 0) {
      user.bulkPurchaseEnabled = true;
    } else {
      user.bulkPurchaseEnabled = false;
    }
    await user.save();

    return res.json({
      message: `Subscription successfully set for testing (${daysLeft} days left)`,
      sellerType: user.sellerType,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionValidUntil: user.subscriptionValidUntil,
      subscriptionActive: user.subscriptionActive,
      bulkPurchaseEnabled: user.bulkPurchaseEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const triggerRemindersForTest = async (req, res) => {
  try {
    await runSubscriptionReminders();
    return res.json({
      success: true,
      message: "Subscription reminders check triggered and completed successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const triggerReferralFollowUpsForTest = async (req, res) => {
  try {
    await runReferralFollowUps();
    return res.json({
      success: true,
      message: "Referral follow-ups check triggered and completed successfully.",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};