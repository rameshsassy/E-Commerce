import crypto from "crypto";
import User from "../models/User.js";

const CODE_PREFIX = "ASH";

function randomSuffix(length = 6) {
  return crypto.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
}

export function buildReferralCode() {
  return `${CODE_PREFIX}${randomSuffix(6)}`;
}

export function sellerPortalBaseUrl() {
  const fromEnv = process.env.SELLER_FRONTEND_URL?.split(",")[0]?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://seller.localhost:5173";
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
  };
}
