/**
 * Customer Rewards Controller
 * Handles customer-facing reward APIs.
 * All data returned is derived from campaign config — nothing hardcoded.
 */

import RewardWallet from "../models/RewardWallet.js";
import RewardTransaction from "../models/RewardTransaction.js";
import RewardCampaign from "../models/RewardCampaign.js";
import { redeemRewardVoucher } from "../services/rewardEngine.service.js";

// ─────────────────────────────────────────────────────────
// GET /api/rewards/me
// Summary of wallet, balance, earned, redeemed
// ─────────────────────────────────────────────────────────
export const getMyRewardSummary = async (req, res) => {
  try {
    const customerId = req.user._id;
    const now = new Date();

    // Auto-expire stale vouchers
    await RewardWallet.updateMany(
      { customer: customerId, status: "active", expiryDate: { $lt: now } },
      { status: "expired" }
    );

    const wallets = await RewardWallet.find({ customer: customerId })
      .populate("campaign", "campaignName branding rewardRule status")
      .sort({ createdAt: -1 });

    const availableBalance = wallets
      .filter((w) => w.status === "active")
      .reduce((sum, w) => sum + w.rewardValue, 0);

    const totalEarned = wallets
      .filter((w) => ["active", "redeemed"].includes(w.status))
      .reduce((sum, w) => sum + w.rewardValue, 0);

    const totalRedeemed = wallets
      .filter((w) => w.status === "redeemed")
      .reduce((sum, w) => sum + w.rewardValue, 0);

    // Fetch active campaigns for display on rewards page
    const activeCampaigns = await RewardCampaign.find({
      status: "active",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).select("campaignName campaignDescription branding rewardRule startDate endDate campaignBanner campaignIcon");

    res.json({
      availableBalance: Math.round(availableBalance * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalRedeemed: Math.round(totalRedeemed * 100) / 100,
      activeVouchers: wallets.filter((w) => w.status === "active").length,
      activeCampaigns,
    });
  } catch (err) {
    console.error("[Rewards] getMyRewardSummary error:", err);
    res.status(500).json({ message: "Failed to fetch reward summary." });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rewards/wallet
// All vouchers in customer's wallet
// ─────────────────────────────────────────────────────────
export const getMyWallet = async (req, res) => {
  try {
    const customerId = req.user._id;
    const now = new Date();

    // Auto-expire
    await RewardWallet.updateMany(
      { customer: customerId, status: "active", expiryDate: { $lt: now } },
      { status: "expired" }
    );

    const wallets = await RewardWallet.find({ customer: customerId })
      .populate("campaign", "campaignName branding")
      .sort({ createdAt: -1 });

    res.json({ wallet: wallets });
  } catch (err) {
    console.error("[Rewards] getMyWallet error:", err);
    res.status(500).json({ message: "Failed to fetch wallet." });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/rewards/history
// Full transaction history
// ─────────────────────────────────────────────────────────
export const getMyRewardHistory = async (req, res) => {
  try {
    const customerId = req.user._id;

    const transactions = await RewardTransaction.find({ customer: customerId })
      .populate("campaign", "campaignName")
      .populate("order", "createdAt totalAmount orderStatus")
      .sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (err) {
    console.error("[Rewards] getMyRewardHistory error:", err);
    res.status(500).json({ message: "Failed to fetch reward history." });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/rewards/redeem
// Apply a reward voucher at checkout
// Body: { voucherId, orderId, orderAmount }
// ─────────────────────────────────────────────────────────
export const redeemReward = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { voucherId, orderId, orderAmount } = req.body;

    if (!voucherId || !orderAmount) {
      return res.status(400).json({ message: "voucherId and orderAmount are required." });
    }

    const result = await redeemRewardVoucher(
      customerId,
      voucherId,
      orderId || null,
      Number(orderAmount)
    );

    res.json({
      message: "Reward applied successfully.",
      rewardValue: result.rewardValue,
      voucherCode: result.voucherCode,
    });
  } catch (err) {
    console.error("[Rewards] redeemReward error:", err);
    res.status(400).json({ message: err.message || "Failed to redeem reward." });
  }
};
