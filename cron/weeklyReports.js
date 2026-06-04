import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import BulkInquiry from "../models/BulkInquiry.js";
import { sendWeeklySellerReport } from "../services/email.service.js";

export async function getWeeklySellerReportData(seller) {
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  // 1. B2C Orders this week
  const orders = await Order.find({
    paymentStatus: "completed",
    createdAt: { $gte: weekAgo },
    "items.seller": seller._id,
  }).select("items");

  let revenue = 0;
  const orderIds = new Set();
  for (const o of orders) {
    let touched = false;
    for (const it of o.items || []) {
      if (it.seller?.toString() === seller._id.toString()) {
        revenue += (it.price || 0) * (it.quantity || 0);
        touched = true;
      }
    }
    if (touched) orderIds.add(o._id.toString());
  }
  const b2cOrdersCount = orderIds.size;

  // 2. Bulk orders this week
  const bulkOrdersCount = await BulkInquiry.countDocuments({
    sellerId: seller._id,
    createdAt: { $gte: weekAgo },
  });

  // 3. Referrals: new sellers invited this week
  const referralsCount = await User.countDocuments({
    role: "seller",
    referredBySellerId: seller._id,
    createdAt: { $gte: weekAgo },
  });

  // 4. Referral earnings this week
  const referredSellers = await User.find({
    role: "seller",
    referredBySellerId: seller._id,
    createdAt: { $gte: weekAgo },
  }).select("kycStatus sellerType subscriptionActive");

  let referralEarnings = 0;
  const referrerIsPremium = seller.sellerType === "premium" && seller.subscriptionActive === true;
  const approvedCredit = referrerIsPremium ? 750 : 500;
  const premiumBonus = referrerIsPremium ? 1500 : 500;

  for (const ref of referredSellers) {
    if (ref.kycStatus === "approved") {
      referralEarnings += approvedCredit;
      const isPremium = ref.sellerType === "premium" && ref.subscriptionActive === true;
      if (isPremium) {
        referralEarnings += premiumBonus;
      }
    }
  }

  // 5. Products listed/active
  const productsCount = await Product.countDocuments({ sellerId: seller._id, isActive: true });

  return {
    b2cOrdersCount,
    bulkOrdersCount,
    referralsCount,
    referralEarnings,
    revenue,
    productsCount,
  };
}

export async function runWeeklySellerReports() {
  const sellers = await User.find({ role: "seller", status: "approved" })
    .select("firstName email sellerType subscriptionActive")
    .limit(300);

  for (const seller of sellers) {
    try {
      const summary = await getWeeklySellerReportData(seller);
      await sendWeeklySellerReport(seller, summary);
    } catch (err) {
      console.error(`[cron] failed to send weekly report to ${seller.email}:`, err);
    }
  }
}

