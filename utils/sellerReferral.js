import crypto from "crypto";
import User from "../models/User.js";

const CODE_PREFIX = "ASH";

function randomSuffix(length = 6) {
  return crypto.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
}

export function buildReferralCode() {
  return `${CODE_PREFIX}${randomSuffix(6)}`;
}

export function sellerRegisterUrl(frontendBase, code) {
  const base = String(frontendBase || "http://localhost:5173").replace(/\/$/, "");
  return `${base}/register?role=seller&ref=${encodeURIComponent(code)}`;
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
