import mongoose from "mongoose";

const rewardTransactionSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardCampaign",
      default: null,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardWallet",
      default: null,
    },
    type: {
      type: String,
      enum: ["credit", "debit", "manual_credit", "manual_debit", "expired", "blocked"],
      required: true,
    },
    rewardType: {
      type: String,
      enum: ["fixed_voucher", "percentage", "points"],
      default: null,
    },
    sellerPlan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: null,
    },
    orderAmount: {
      type: Number,
      default: 0,
    },
    rewardEarned: {
      type: Number,
      default: 0,
    },
    rewardRedeemed: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "reversed"],
      default: "completed",
    },
    processedBy: {
      // admin user ObjectId for manual operations
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

rewardTransactionSchema.index({ customer: 1, createdAt: -1 });
rewardTransactionSchema.index({ order: 1 });
rewardTransactionSchema.index({ campaign: 1, type: 1 });
rewardTransactionSchema.index({ createdAt: -1 });

export default mongoose.model("RewardTransaction", rewardTransactionSchema, "rewardtransactions");
