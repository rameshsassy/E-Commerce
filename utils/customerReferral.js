import crypto from "crypto";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

const CODE_PREFIX = "ASHC";

function randomSuffix(length = 6) {
  return crypto.randomBytes(length).toString("hex").slice(0, length).toUpperCase();
}

export function buildCustomerReferralCode() {
  return `${CODE_PREFIX}${randomSuffix(6)}`;
}

export function customerFrontendBaseUrl(req) {
  if (req) {
    const raw = req.headers?.origin || req.headers?.referer;
    if (raw) {
      try {
        const parsed = new URL(raw);
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1"
        ) {
          return parsed.origin;
        }
      } catch {
        /* ignore */
      }
    }
  }

  const fromEnv = process.env.FRONTEND_URL?.split(",")[0]?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  return "http://localhost:5173";
}

export function customerRegisterUrl(frontendBase, code) {
  const base = String(frontendBase || customerFrontendBaseUrl()).replace(/\/$/, "");
  const url = new URL("/auth", base);
  url.searchParams.set("tab", "register");
  url.searchParams.set("ref", String(code || "").trim());
  return url.toString();
}

export async function ensureCustomerReferralCode(customer) {
  if (customer.customerReferralCode) return customer.customerReferralCode;

  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = buildCustomerReferralCode();
    const taken = await Customer.findOne({ customerReferralCode: candidate }).select("_id");
    if (taken) continue;

    customer.customerReferralCode = candidate;
    await customer.save();
    return candidate;
  }

  throw new Error("Could not generate a unique referral code");
}

export async function findCustomerReferrerByCode(code) {
  if (!code || typeof code !== "string") return null;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return Customer.findOne({
    customerReferralCode: normalized,
  }).select("_id firstName lastName customerReferralCode");
}

export const CUSTOMER_REFERRAL_REWARDS = {
  REFERRAL_CREDIT: 500,
};

export async function getCustomerReferralStats(referrerId, referrerUser, { limit = 100 } = {}) {
  const allReferred = await Customer.find({
    referredByCustomerId: referrerId,
  })
    .select("firstName lastName status createdAt")
    .sort({ createdAt: -1 });

  const limitNum = Math.max(1, Math.min(Number(limit) || 100, 100));
  const referred = allReferred.slice(0, limitNum);

  const approvedCredit = CUSTOMER_REFERRAL_REWARDS.REFERRAL_CREDIT;

  let totalApproved = 0;
  let totalPending = 0;
  let creditsEarned = 0;
  let pendingCredits = 0;

  const referredCustomers = referred.map((cust) => {
    const status = cust.status || "approved";
    if (status === "pending") {
      totalPending += 1;
      pendingCredits += approvedCredit;
    } else {
      totalApproved += 1;
      creditsEarned += approvedCredit;
    }

    const displayName = [cust.firstName, cust.lastName].filter(Boolean).join(" ").trim() || "Customer";

    return {
      name: displayName,
      status,
      joinedAt: cust.createdAt,
    };
  });

  const referredIds = allReferred.map((u) => u._id);
  let totalOrdersCount = 0;
  let totalOrderSpend = 0;

  if (referredIds.length > 0) {
    const [ordersCount, spendAgg] = await Promise.all([
      Order.countDocuments({ customer: { $in: referredIds }, orderStatus: { $ne: "cancelled" } }),
      Order.aggregate([
        { $match: { customer: { $in: referredIds }, paymentStatus: "completed" } },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ])
    ]);
    totalOrdersCount = ordersCount;
    totalOrderSpend = spendAgg[0]?.total || 0;
  }

  return {
    referralSignups: referred.length,
    totalInvites: referred.length,
    totalApproved,
    totalPending,
    creditsEarned,
    pendingCredits,
    referredCustomers,
    rewardRates: {
      approvedCredit,
    },
    totalOrdersCount,
    totalOrderSpend,
  };
}

export const CUSTOMER_REFER_PROGRAM = {
  title: "Refer and Earn",
  subtitle: "Invite your friends to shop on Aashansh and earn rewards when they register and place orders.",
  shareTemplate: "Hey! Shop with me on Aashansh - discover amazing products, fast delivery, and earn rewards. Register using my link: {{Link}} or use my code {{CODE}} to get special welcome rewards. Let's shop together!",
  steps: [
    {
      title: "Share your link or send an invite",
      description: "Copy your referral link or send a branded invitation email from this page to friends and family who want to shop on Aashansh.",
    },
    {
      title: "They register as customers",
      description: "Your friends sign up using your link or enter your referral code during registration.",
    },
    {
      title: "Earn when they shop",
      description: "Once they register and shop on Aashansh, you receive referral reward credits (program terms apply).",
    },
  ],
  rewardsTitle: "Referral Rewards",
  rewardsSubtitle: "Terms of use",
  rewards: [
    "Referrals are valid only when the invited customer registers a unique account and verifies their email/phone.",
    "Referrals that are fraudulent, self-referrals, or created using duplicate accounts will not qualify for rewards.",
    "Aashansh reserves the right to deny rewards or suspend accounts for suspicious activities like spamming, bot sign-ups, or violating platform policies.",
    "This Refer and Earn program can be modified, suspended, or terminated by Aashansh at any time without prior notice. Existing earned rewards will remain valid.",
  ],
};
