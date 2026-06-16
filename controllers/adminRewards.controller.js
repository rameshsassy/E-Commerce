/**
 * Admin Rewards Controller
 * Super Admin campaign management, customer reward management, and reports.
 * Only admin users can access these endpoints.
 */

import mongoose from "mongoose";
import RewardCampaign from "../models/RewardCampaign.js";
import RewardWallet from "../models/RewardWallet.js";
import RewardTransaction from "../models/RewardTransaction.js";
import RewardSettings from "../models/RewardSettings.js";
import Customer from "../models/Customer.js";

// ═══════════════════════════════════════════════════════════
// CAMPAIGN MANAGEMENT
// ═══════════════════════════════════════════════════════════

// GET /api/admin/rewards/campaigns
export const listCampaigns = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await RewardCampaign.countDocuments(filter);
    const campaigns = await RewardCampaign.find(filter)
      .sort({ priority: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("createdBy", "name email");

    res.json({ campaigns, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[AdminRewards] listCampaigns error:", err);
    res.status(500).json({ message: "Failed to fetch campaigns." });
  }
};

// GET /api/admin/rewards/campaigns/:id
export const getCampaign = async (req, res) => {
  try {
    const campaign = await RewardCampaign.findById(req.params.id).populate("createdBy", "name email");
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });
    res.json({ campaign });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch campaign." });
  }
};

// POST /api/admin/rewards/campaigns
export const createCampaign = async (req, res) => {
  try {
    const adminId = req.user._id;
    const campaignData = { ...req.body, createdBy: adminId };

    // Validate dates
    if (new Date(campaignData.startDate) > new Date(campaignData.endDate)) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    const campaign = await RewardCampaign.create(campaignData);
    res.status(201).json({ message: "Campaign created successfully.", campaign });
  } catch (err) {
    console.error("[AdminRewards] createCampaign error:", err);
    res.status(400).json({ message: err.message || "Failed to create campaign." });
  }
};

// PUT /api/admin/rewards/campaigns/:id
export const updateCampaign = async (req, res) => {
  try {
    const campaign = await RewardCampaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });

    // Validate dates if provided
    const startDate = req.body.startDate || campaign.startDate;
    const endDate = req.body.endDate || campaign.endDate;
    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Start date must be before end date." });
    }

    const updated = await RewardCampaign.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ message: "Campaign updated successfully.", campaign: updated });
  } catch (err) {
    console.error("[AdminRewards] updateCampaign error:", err);
    res.status(400).json({ message: err.message || "Failed to update campaign." });
  }
};

// DELETE /api/admin/rewards/campaigns/:id
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await RewardCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found." });
    res.json({ message: "Campaign deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete campaign." });
  }
};

// ═══════════════════════════════════════════════════════════
// CUSTOMER REWARDS MANAGEMENT
// ═══════════════════════════════════════════════════════════

// GET /api/admin/rewards/customers
export const listCustomerRewards = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    // Aggregate per-customer reward summaries
    const pipeline = [
      {
        $group: {
          _id: "$customer",
          totalEarned: { $sum: { $cond: [{ $eq: ["$type", "credit"] }, "$rewardEarned", 0] } },
          totalRedeemed: { $sum: { $cond: [{ $eq: ["$type", "debit"] }, "$rewardRedeemed", 0] } },
          transactionCount: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerData",
        },
      },
      { $unwind: "$customerData" },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "customerData.firstName": { $regex: search, $options: "i" } },
            { "customerData.lastName": { $regex: search, $options: "i" } },
            { "customerData.email": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { totalEarned: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    );

    const results = await RewardTransaction.aggregate(pipeline);

    res.json({ customers: results, page: Number(page) });
  } catch (err) {
    console.error("[AdminRewards] listCustomerRewards error:", err);
    res.status(500).json({ message: "Failed to fetch customer rewards." });
  }
};

// GET /api/admin/rewards/customers/:customerId
export const getCustomerRewardDetail = async (req, res) => {
  try {
    const { customerId } = req.params;

    const wallets = await RewardWallet.find({ customer: customerId })
      .populate("campaign", "campaignName")
      .sort({ createdAt: -1 });

    const transactions = await RewardTransaction.find({ customer: customerId })
      .populate("campaign", "campaignName")
      .populate("order", "createdAt totalAmount orderStatus")
      .sort({ createdAt: -1 });

    const availableBalance = wallets
      .filter((w) => w.status === "active")
      .reduce((sum, w) => sum + w.rewardValue, 0);

    res.json({ wallets, transactions, availableBalance });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customer reward detail." });
  }
};

// PUT /api/admin/rewards/customers/:customerId/adjust
// Manual add/remove/expire/block reward
export const adjustCustomerReward = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { action, amount, note, voucherId, campaignId } = req.body;
    const adminId = req.user._id;

    if (!["add", "remove", "expire", "block"].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use: add, remove, expire, block." });
    }

    if (action === "expire" || action === "block") {
      if (!voucherId) return res.status(400).json({ message: "voucherId is required." });
      const newStatus = action === "expire" ? "expired" : "blocked";
      await RewardWallet.findOneAndUpdate(
        { _id: voucherId, customer: customerId },
        { status: newStatus }
      );
      await RewardTransaction.create({
        customer: customerId,
        wallet: voucherId,
        type: action === "expire" ? "expired" : "blocked",
        orderAmount: 0,
        rewardEarned: 0,
        rewardRedeemed: 0,
        description: note || `Admin manually ${action}d reward.`,
        status: "completed",
        processedBy: adminId,
      });
      return res.json({ message: `Reward ${action}d successfully.` });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }

    if (action === "add") {
      // Find a campaign to link to (optional)
      let campaign = campaignId ? campaignId : null;

      // Generate voucher code
      const voucherCode = `ADMIN-${Date.now().toString(36).toUpperCase()}`;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const wallet = await RewardWallet.create({
        customer: customerId,
        campaign: campaign || (await RewardCampaign.findOne())?._id,
        voucherCode,
        rewardType: "fixed_voucher",
        rewardValue: amount,
        expiryDate,
        status: "active",
        manuallyAdded: true,
        manualNote: note || "Added by admin.",
      });

      await RewardTransaction.create({
        customer: customerId,
        wallet: wallet._id,
        type: "manual_credit",
        orderAmount: 0,
        rewardEarned: amount,
        rewardRedeemed: 0,
        description: note || "Manual reward credit by admin.",
        status: "completed",
        processedBy: adminId,
      });

      return res.json({ message: "Reward added successfully.", wallet });
    }

    if (action === "remove") {
      // Debit — mark the wallet voucher(s) as blocked
      await RewardTransaction.create({
        customer: customerId,
        type: "manual_debit",
        orderAmount: 0,
        rewardEarned: 0,
        rewardRedeemed: amount,
        description: note || "Manual reward debit by admin.",
        status: "completed",
        processedBy: adminId,
      });
      return res.json({ message: "Reward removed successfully." });
    }
  } catch (err) {
    console.error("[AdminRewards] adjustCustomerReward error:", err);
    res.status(500).json({ message: "Failed to adjust reward." });
  }
};

// ═══════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════

// GET /api/admin/rewards/transactions
export const listTransactions = async (req, res) => {
  try {
    const { type, campaignId, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (campaignId) filter.campaign = campaignId;

    const total = await RewardTransaction.countDocuments(filter);
    const transactions = await RewardTransaction.find(filter)
      .populate("customer", "firstName lastName email")
      .populate("campaign", "campaignName")
      .populate("order", "createdAt totalAmount orderStatus")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ transactions, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    console.error("[AdminRewards] listTransactions error:", err);
    res.status(500).json({ message: "Failed to fetch transactions." });
  }
};

// ═══════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════

// GET /api/admin/rewards/reports
export const getReports = async (req, res) => {
  try {
    const now = new Date();

    // Total issued / redeemed / active / expired
    const [issuedAgg, redeemedAgg, activeAgg, expiredAgg] = await Promise.all([
      RewardTransaction.aggregate([
        { $match: { type: { $in: ["credit", "manual_credit"] }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$rewardEarned" }, count: { $sum: 1 } } },
      ]),
      RewardTransaction.aggregate([
        { $match: { type: { $in: ["debit", "manual_debit"] }, status: "completed" } },
        { $group: { _id: null, total: { $sum: "$rewardRedeemed" }, count: { $sum: 1 } } },
      ]),
      RewardWallet.countDocuments({ status: "active", expiryDate: { $gte: now } }),
      RewardWallet.countDocuments({ status: "expired" }),
    ]);

    // Top customers by rewards earned
    const topCustomers = await RewardTransaction.aggregate([
      { $match: { type: { $in: ["credit", "manual_credit"] } } },
      { $group: { _id: "$customer", totalEarned: { $sum: "$rewardEarned" } } },
      { $sort: { totalEarned: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $project: {
          totalEarned: 1,
          "customer.firstName": 1,
          "customer.lastName": 1,
          "customer.email": 1,
        },
      },
    ]);

    // Top campaigns
    const topCampaigns = await RewardCampaign.find()
      .select("campaignName totalRewardsIssued totalRewardsRedeemed totalCustomersRewarded status")
      .sort({ totalRewardsIssued: -1 })
      .limit(10);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await RewardTransaction.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo }, status: "completed" } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, type: "$type" },
          amount: {
            $sum: { $cond: [{ $in: ["$type", ["credit", "manual_credit"]] }, "$rewardEarned", "$rewardRedeemed"] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.json({
      summary: {
        totalIssued: issuedAgg[0]?.total || 0,
        totalIssuedCount: issuedAgg[0]?.count || 0,
        totalRedeemed: redeemedAgg[0]?.total || 0,
        totalRedeemedCount: redeemedAgg[0]?.count || 0,
        totalActive: activeAgg,
        totalExpired: expiredAgg,
      },
      topCustomers,
      topCampaigns,
      monthlyTrend,
    });
  } catch (err) {
    console.error("[AdminRewards] getReports error:", err);
    res.status(500).json({ message: "Failed to generate reports." });
  }
};

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════

// GET /api/admin/rewards/settings
export const getSettings = async (req, res) => {
  try {
    let settings = await RewardSettings.findOne({ _singleton: "global" });
    if (!settings) {
      settings = await RewardSettings.create({ _singleton: "global" });
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reward settings." });
  }
};

// PUT /api/admin/rewards/settings
export const updateSettings = async (req, res) => {
  try {
    const adminId = req.user._id;
    let settings = await RewardSettings.findOneAndUpdate(
      { _singleton: "global" },
      { $set: { ...req.body, updatedBy: adminId } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ message: "Settings updated.", settings });
  } catch (err) {
    console.error("[AdminRewards] updateSettings error:", err);
    res.status(400).json({ message: err.message || "Failed to update settings." });
  }
};
