import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";
import BulkInquiry from "../models/BulkInquiry.js";
import {
  sendBulkInquirySellerEmail,
  sendBulkInquiryAdminEmail,
  sendBulkInquiryBuyerConfirmation,
} from "../services/email.service.js";
import { generateBulkRequestId } from "../utils/bulkRequestId.js";
import { BUYER_TYPE_OPTIONS } from "../utils/bulkInquiryConstants.js";
import {
  parseQuantityVariants,
  mapBulkInquiryForSeller,
  estimateCostFromProduct,
} from "../utils/bulkInquiryView.js";
import {
  SELLER_ORDER_STATUS_OPTIONS,
  applyStatusToTimeline,
} from "../utils/sellerOrderStatus.js";
import {
  logBulkInquiryActivity,
} from "../services/sellerActivity.service.js";

const appBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "");

function sellerIsPremium(seller) {
  if (!seller) return false;
  return (
    seller.sellerType === "premium" &&
    seller.subscriptionActive === true &&
    seller.bulkPurchaseEnabled !== false
  );
}

async function optionalCustomerId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(decoded.id).select("role");
    if (u && u.role === "customer") return u._id;
  } catch {
    return null;
  }
  return null;
}

const INQUIRY_STATUSES = [
  "Negotiation Pending",
  "Meeting Scheduled",
  "Completed",
  "Cancelled",
];

function assertInquiryAccess(inquiry, user) {
  const isAdmin = user.role === "admin" || user.role === "admin_staff";
  const isSeller = user.role === "seller";
  if (isSeller) {
    if (inquiry.sellerId.toString() !== user._id.toString()) {
      return { ok: false, status: 403, message: "Not authorized" };
    }
    return { ok: true, isAdmin: false, isSeller: true };
  }
  if (isAdmin) return { ok: true, isAdmin: true, isSeller: false };
  return { ok: false, status: 403, message: "Not authorized" };
}

/**
 * POST /api/products/:id/bulk-inquiry
 */
export const createBulkInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contactNumber,
      email,
      quantityRequired,
      message,
      buyerCity,
      companyOrganisation,
      requestedDeliveryDate,
    } = req.body;

    if (!name?.trim() || !contactNumber?.trim() || !email?.trim() || !quantityRequired?.trim()) {
      return res.status(400).json({
        message: "Name, contact number, email, and quantity required are required.",
      });
    }

    const isMock = !mongoose.Types.ObjectId.isValid(id);
    let seller;
    let product = null;

    if (!isMock) {
      product = await Product.findById(id).populate({
        path: "sellerId",
        select:
          "firstName lastName email businessName sellerType subscriptionActive bulkPurchaseEnabled",
      });

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (!product.isActive || product.approvalStatus !== "approved") {
        return res.status(404).json({ message: "Product not available" });
      }

      seller = product.sellerId;
      if (!sellerIsPremium(seller)) {
        return res.status(403).json({
          message:
            "Bulk orders are only available for products sold by Premium sellers. This seller is not eligible.",
        });
      }
    } else {
      const resolvedSellerId = req.body.sellerId || req.user?._id;
      if (!resolvedSellerId || !mongoose.Types.ObjectId.isValid(resolvedSellerId)) {
        return res.status(400).json({ message: "Valid sellerId is required for custom products." });
      }
      seller = await User.findById(resolvedSellerId).select(
        "firstName lastName email businessName sellerType subscriptionActive bulkPurchaseEnabled"
      );
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }
    }

    const buyerId = await optionalCustomerId(req);
    const variantLines = parseQuantityVariants(quantityRequired);
    const placedAt = new Date();
    let deliveryDate = null;
    if (requestedDeliveryDate) {
      deliveryDate = new Date(requestedDeliveryDate);
      if (Number.isNaN(deliveryDate.getTime())) deliveryDate = null;
    }
    if (!deliveryDate) {
      deliveryDate = new Date(placedAt);
      deliveryDate.setDate(deliveryDate.getDate() + 30);
    }
    const deliveryLeadDays = Math.max(
      1,
      Math.ceil((deliveryDate - placedAt) / (24 * 60 * 60 * 1000))
    );
    const estimatedCost = isMock
      ? estimateCostFromProduct(null, variantLines, { productPrice: req.body.productPrice })
      : estimateCostFromProduct(product, variantLines);
    const displayBulkRequestId = await generateBulkRequestId(seller._id, placedAt);

    const inquiry = await BulkInquiry.create({
      sellerId: seller._id,
      productId: isMock ? null : product._id,
      productTitle: isMock ? req.body.productTitle : undefined,
      productPrice: isMock ? req.body.productPrice : undefined,
      productImage: isMock ? req.body.productImage : undefined,
      productMinQty: isMock ? req.body.productMinQty : undefined,
      buyerId,
      buyerName: name.trim(),
      buyerEmail: email.trim().toLowerCase(),
      buyerPhone: contactNumber.trim(),
      buyerCity: typeof buyerCity === "string" ? buyerCity.trim() : "",
      companyOrganisation:
        typeof companyOrganisation === "string" ? companyOrganisation.trim() : "",
      quantityRequired: String(quantityRequired).trim(),
      variantLines,
      estimatedCost,
      requestedDeliveryDate: deliveryDate,
      deliveryLeadDays,
      message: typeof message === "string" ? message.trim() : "",
      displayBulkRequestId,
      statusTimeline: {
        orderPlaced: placedAt,
        estimatedDelivery: deliveryDate,
      },
    });

    const inquiryPayload = {
      inquiryId: inquiry._id,
      displayBulkRequestId: inquiry.displayBulkRequestId,
      buyerName: inquiry.buyerName,
      buyerEmail: inquiry.buyerEmail,
      buyerPhone: inquiry.buyerPhone,
      quantityRequired: inquiry.quantityRequired,
      message: inquiry.message,
      productTitle: isMock ? req.body.productTitle : product.title,
      productId: isMock ? id : product._id,
      productUrl: isMock ? "#" : `${appBaseUrl()}/product/${product._id}`,
    };

    await Promise.allSettled([
      sendBulkInquirySellerEmail(seller, inquiryPayload),
      sendBulkInquiryAdminEmail(inquiryPayload),
      sendBulkInquiryBuyerConfirmation(inquiryPayload),
    ]);

    return res.status(201).json({
      message:
        "Bulk inquiry submitted successfully. You will receive a confirmation email shortly. Our team may contact you to coordinate next steps.",
      inquiryId: inquiry._id,
      displayBulkRequestId: inquiry.displayBulkRequestId,
    });
  } catch (error) {
    console.error("createBulkInquiry:", error);
    res.status(500).json({ message: error.message || "Failed to submit bulk inquiry" });
  }
};

/**
 * GET /api/seller/bulk-inquiries
 */
export const listSellerBulkInquiries = async (req, res) => {
  try {
    const inquiries = await BulkInquiry.find({ sellerId: req.user._id })
      .populate("productId", "title images price")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = await Promise.all(
      inquiries.map((row) =>
        mapBulkInquiryForSeller(
          { ...row, productTitle: row.productId?.title },
          { persistId: true }
        )
      )
    );

    res.json({ count: mapped.length, inquiries: mapped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/seller/bulk-inquiries/:id
 */
export const getSellerBulkInquiryDetail = async (req, res) => {
  try {
    const inquiry = await BulkInquiry.findById(req.params.id)
      .populate("productId", "title images price")
      .lean();

    if (!inquiry) {
      return res.status(404).json({ message: "Bulk inquiry not found" });
    }

    const access = assertInquiryAccess(inquiry, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    const data = await mapBulkInquiryForSeller(inquiry, { persistId: true });
    res.json({ message: "Bulk inquiry fetched", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/admin/bulk-inquiries
 */
export const listAdminBulkInquiries = async (req, res) => {
  try {
    const inquiries = await BulkInquiry.find({})
      .populate("productId", "title")
      .populate("sellerId", "firstName lastName email businessName")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: inquiries.length,
      inquiries: inquiries.map((row) => ({
        ...row,
        productTitle: row.productId?.title || "—",
        sellerLabel:
          row.sellerId?.businessName ||
          [row.sellerId?.firstName, row.sellerId?.lastName].filter(Boolean).join(" ") ||
          "—",
        sellerEmail: row.sellerId?.email,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH /api/seller/bulk-inquiries/:id — seller detail updates
 * PATCH /api/admin/bulk-inquiries/:id — admin coordination status
 */
export const updateBulkInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      buyerType,
      estimatedCost,
      requestedDeliveryDate,
      deliveryLeadDays,
      sellerOrderStatus,
      companyOrganisation,
    } = req.body;

    const inquiry = await BulkInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const access = assertInquiryAccess(inquiry, req.user);
    if (!access.ok) {
      return res.status(access.status).json({ message: access.message });
    }

    if (status != null) {
      if (!INQUIRY_STATUSES.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
          allowed: INQUIRY_STATUSES,
        });
      }
      inquiry.status = status;
    }

    if (buyerType != null) {
      if (!BUYER_TYPE_OPTIONS.includes(buyerType)) {
        return res.status(400).json({
          message: "Invalid buyer type",
          allowed: BUYER_TYPE_OPTIONS,
        });
      }
      inquiry.buyerType = buyerType;
      inquiry.buyerTypeUpdatedAt = new Date();
    }

    if (estimatedCost != null) {
      const n = Number(estimatedCost);
      if (!Number.isFinite(n) || n < 0) {
        return res.status(400).json({ message: "Invalid estimated cost" });
      }
      inquiry.estimatedCost = n;
    }

    if (requestedDeliveryDate != null) {
      const d = new Date(requestedDeliveryDate);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid requested delivery date" });
      }
      inquiry.requestedDeliveryDate = d;
      if (!inquiry.statusTimeline) inquiry.statusTimeline = {};
      inquiry.statusTimeline.estimatedDelivery = d;
      inquiry.markModified("statusTimeline");
    }

    if (deliveryLeadDays != null) {
      const days = parseInt(String(deliveryLeadDays), 10);
      if (Number.isFinite(days) && days > 0) inquiry.deliveryLeadDays = days;
    }

    if (companyOrganisation != null) {
      inquiry.companyOrganisation = String(companyOrganisation).trim();
    }

    if (sellerOrderStatus != null) {
      if (!SELLER_ORDER_STATUS_OPTIONS.includes(sellerOrderStatus)) {
        return res.status(400).json({ message: "Invalid seller order status" });
      }
      inquiry.sellerOrderStatus = sellerOrderStatus;
      inquiry.statusTimeline = applyStatusToTimeline(
        inquiry.statusTimeline?.toObject?.() ?? inquiry.statusTimeline,
        sellerOrderStatus
      );
      inquiry.markModified("statusTimeline");
      if (sellerOrderStatus === "Accept Order") {
        inquiry.status = "Meeting Scheduled";
      }
      if (sellerOrderStatus === "Product Delivered") {
        inquiry.status = "Completed";
      }
      if (sellerOrderStatus === "Reject Order") {
        inquiry.status = "Cancelled";
      }
    }

    await inquiry.save();

    if (access.isSeller) {
      if (buyerType != null) {
        logBulkInquiryActivity(
          req.user._id,
          inquiry.displayBulkRequestId,
          `Buyer type set to ${buyerType}`
        );
      } else if (sellerOrderStatus != null) {
        logBulkInquiryActivity(
          req.user._id,
          inquiry.displayBulkRequestId,
          sellerOrderStatus
        );
      } else if (status != null) {
        logBulkInquiryActivity(req.user._id, inquiry.displayBulkRequestId, status);
      }
    }

    const updated = await BulkInquiry.findById(inquiry._id)
      .populate("productId", "title images price")
      .populate("sellerId", "firstName lastName email businessName")
      .lean();

    const payload =
      access.isSeller
        ? { message: "Bulk inquiry updated", data: await mapBulkInquiryForSeller(updated, { persistId: false }) }
        : {
            message: "Inquiry updated",
            inquiry: {
              ...updated,
              productTitle: updated.productId?.title || "—",
            },
          };

    res.json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
