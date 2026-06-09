import crypto from "crypto";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";

const CODE_PREFIX = "ASH";

function randomSuffix(length = 6) {
  return crypto.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
}

export function buildReferralCode() {
  return `${CODE_PREFIX}${randomSuffix(6)}`;
}

export function sellerPortalBaseUrl(req) {
  if (req) {
    const raw = req.headers?.origin || req.headers?.referer;
    if (raw) {
      try {
        const parsed = new URL(raw);
        if (!parsed.hostname.includes("localhost")) {
          return parsed.origin;
        }
      } catch {
        /* ignore */
      }
    }
  }
  const fromEnv = process.env.SELLER_FRONTEND_URL?.split(",")[0]?.trim();
  if (fromEnv && !fromEnv.includes("localhost")) return fromEnv.replace(/\/$/, "");

  const customerEnv = process.env.FRONTEND_URL?.split(",")[0]?.trim();
  if (customerEnv && !customerEnv.includes("localhost")) return customerEnv.replace(/\/$/, "");

  return "https://e-commerce-snj1.vercel.app";
}

export function sellerRegisterUrl(frontendBase, code) {
  const base = String(frontendBase || sellerPortalBaseUrl()).replace(/\/$/, "");
  const url = new URL("/register", base);
  url.searchParams.set("portal", "seller");
  url.searchParams.set("ref", String(code || "").trim());
  return url.toString();
}

/** Ensure the seller has a unique referral code (lazy-created for existing accounts). */
export async function ensureSellerReferralCode(user) {
  if (user.sellerReferralCode) return user.sellerReferralCode;

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = buildReferralCode();
    const taken = await User.findOne({ sellerReferralCode: candidate }).select("_id");
    if (taken) continue;

    user.sellerReferralCode = candidate;
    await user.save();
    return candidate;
  }

  throw new Error("Could not generate a unique referral code");
}

export async function findReferrerByCode(code) {
  if (!code || typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return User.findOne({
    role: "seller",
    sellerReferralCode: normalized,
  }).select("_id firstName businessName sellerReferralCode");
}

export const REFERRAL_REWARDS = {
  FREE_APPROVED_CREDIT: 500,
  PREMIUM_APPROVED_CREDIT: 750,
  FREE_PREMIUM_BONUS: 500,
  PREMIUM_PREMIUM_BONUS: 1500,
};

function isPremiumSeller(user) {
  return user?.sellerType === "premium" && user?.subscriptionActive === true;
}

function referralStatusFor(user) {
  if (user.kycStatus === "approved") {
    return isPremiumSeller(user) ? "premium" : "approved";
  }
  return "pending";
}

/** Aggregate referral stats and referred-seller list for the Refer and Earn page. */
export async function getReferralStatsForSeller(referrerId, referrerUser, { limit = 100 } = {}) {
  const referred = await User.find({
    role: "seller",
    referredBySellerId: referrerId,
  })
    .select(
      "firstName lastName businessName kycStatus sellerType subscriptionActive createdAt"
    )
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(Number(limit) || 100, 100)));

  const referrerIsPremium = isPremiumSeller(referrerUser);
  const approvedCredit = referrerIsPremium
    ? REFERRAL_REWARDS.PREMIUM_APPROVED_CREDIT
    : REFERRAL_REWARDS.FREE_APPROVED_CREDIT;
  const premiumBonus = referrerIsPremium
    ? REFERRAL_REWARDS.PREMIUM_PREMIUM_BONUS
    : REFERRAL_REWARDS.FREE_PREMIUM_BONUS;

  let totalApproved = 0;
  let totalPending = 0;
  let totalPremium = 0;
  let creditsEarned = 0;
  let pendingCredits = 0;

  const referredSellers = referred.map((seller) => {
    const status = referralStatusFor(seller);
    if (status === "pending") {
      totalPending += 1;
      pendingCredits += approvedCredit;
    } else {
      totalApproved += 1;
      creditsEarned += approvedCredit;
      if (status === "premium") {
        totalPremium += 1;
        creditsEarned += premiumBonus;
      }
    }

    const displayName =
      seller.businessName?.trim() ||
      [seller.firstName, seller.lastName].filter(Boolean).join(" ").trim() ||
      "Seller";

    return {
      name: displayName,
      status,
      joinedAt: seller.createdAt,
    };
  });

  // Fetch all referred sellers to calculate aggregate metrics (ignoring page limit)
  const allReferred = await User.find({
    role: "seller",
    referredBySellerId: referrerId,
  }).select("_id subscriptionActive subscriptionPlan kycStatus");

  const referredIds = allReferred.map((u) => u._id);

  // 1. Total Products: count of active products listed by referred sellers
  const totalProducts = referredIds.length > 0
    ? await Product.countDocuments({ sellerId: { $in: referredIds }, isActive: true })
    : 0;

  // 2. Total Subscribed: count of referred sellers with active subscriptions
  const totalSubscribed = allReferred.filter((u) => u.subscriptionActive).length;

  // 3. Total Sale: total completed order revenue generated by all referred sellers
  let totalSale = 0;
  if (referredIds.length > 0) {
    const salesAgg = await Order.aggregate([
      { $match: { "items.seller": { $in: referredIds }, paymentStatus: "completed" } },
      { $unwind: "$items" },
      { $match: { "items.seller": { $in: referredIds } } },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
    ]);
    totalSale = salesAgg[0]?.total || 0;
  }

  // 4. Total Subscription: total subscription fees paid by referred sellers
  let totalSubscription = 0;
  for (const s of allReferred) {
    if (s.subscriptionActive) {
      if (s.subscriptionPlan === "premium") {
        totalSubscription += 198000;
      } else if (s.subscriptionPlan === "pro") {
        totalSubscription += 9125;
      }
    }
  }

  // 5. Credits Earned: count of referred sellers who earned credits (approved KYC)
  const creditsEarnedCount = allReferred.filter((u) => u.kycStatus === "approved").length;

  // 6. My Plan: active subscription plan index (0 = Free, 1 = Pro, 2 = Premium)
  const activePlan = referrerUser.subscriptionPlan || (referrerIsPremium ? "premium" : "free");
  let myPlan = 0;
  if (activePlan === "premium") {
    myPlan = 2;
  } else if (activePlan === "pro") {
    myPlan = 1;
  }

  return {
    referralSignups: referred.length,
    totalInvites: referred.length,
    totalApproved,
    totalPending,
    totalPremium,
    creditsEarned,
    pendingCredits,
    referredSellers,
    rewardRates: {
      approvedCredit,
      premiumBonus,
    },
    // New metrics for the 6-card statistics display
    totalProducts,
    totalSubscribed,
    totalSale,
    totalSubscription,
    creditsEarnedCount,
    myPlan,
  };
}
