import mongoose from "mongoose";

const rewardRuleSchema = new mongoose.Schema(
  {
    rewardType: {
      type: String,
      enum: ["fixed_voucher", "percentage", "points"],
      required: true,
    },
    // For fixed_voucher: spend X get Y voucher
    spendAmount: { type: Number, default: 0 },
    rewardValue: { type: Number, default: 0 }, // fixed INR or points

    // For percentage reward
    rewardPercentage: { type: Number, default: 0 },

    // Seller plan-specific overrides (takes priority over rewardPercentage)
    freeSellerRewardPercentage: { type: Number, default: null },
    proSellerRewardPercentage: { type: Number, default: null },
    premiumSellerRewardPercentage: { type: Number, default: null },

    // Caps
    maxRewardPerOrder: { type: Number, default: null },
    maxRewardPerCustomer: { type: Number, default: null },
    maxActiveVouchers: { type: Number, default: null },
    voucherExpiryDays: { type: Number, default: 30 },
  },
  { _id: false }
);

const productEligibilitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["all", "selected_products", "selected_categories", "selected_sellers", "selected_seller_plans"],
      default: "all",
    },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    sellerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seller" }],
    sellerPlans: [{ type: String, enum: ["free", "pro", "premium"] }],
  },
  { _id: false }
);

const exclusionRulesSchema = new mongoose.Schema(
  {
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
    sellerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seller" }],
    sellerPlans: [{ type: String, enum: ["free", "pro", "premium"] }],
    brands: [{ type: String }],
  },
  { _id: false }
);

const customerEligibilitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["all", "selected_customers", "new_customers_only", "existing_customers_only", "premium_members_only"],
      default: "all",
    },
    customerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Customer" }],
  },
  { _id: false }
);

const brandingSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: "#6366f1" },
    secondaryColor: { type: String, default: "#8b5cf6" },
    buttonColor: { type: String, default: "#6366f1" },
    bannerColor: { type: String, default: "#1e1b4b" },
    cardColor: { type: String, default: "#312e81" },
    theme: { type: String, default: "purple" },
  },
  { _id: false }
);

const rewardCampaignSchema = new mongoose.Schema(
  {
    campaignName: {
      type: String,
      required: true,
      trim: true,
    },
    campaignDescription: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "scheduled", "expired"],
      default: "inactive",
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    campaignBanner: { type: String, default: null },
    campaignIcon: { type: String, default: null },

    rewardRule: { type: rewardRuleSchema, required: true },
    productEligibility: { type: productEligibilitySchema, default: () => ({}) },
    exclusionRules: { type: exclusionRulesSchema, default: () => ({}) },
    customerEligibility: { type: customerEligibilitySchema, default: () => ({}) },
    branding: { type: brandingSchema, default: () => ({}) },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    totalRewardsIssued: { type: Number, default: 0 },
    totalRewardsRedeemed: { type: Number, default: 0 },
    totalCustomersRewarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

rewardCampaignSchema.index({ status: 1, startDate: 1, endDate: 1 });
rewardCampaignSchema.index({ priority: 1 });

export default mongoose.model("RewardCampaign", rewardCampaignSchema, "rewardcampaigns");
