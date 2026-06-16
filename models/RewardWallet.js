import mongoose from "mongoose";

const rewardWalletSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardCampaign",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    voucherCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    rewardType: {
      type: String,
      enum: ["fixed_voucher", "percentage", "points"],
      required: true,
    },
    rewardValue: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "redeemed", "expired", "blocked"],
      default: "active",
    },
    redeemedAt: {
      type: Date,
      default: null,
    },
    redeemedOnOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // Admin manual operations
    manuallyAdded: {
      type: Boolean,
      default: false,
    },
    manualNote: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

rewardWalletSchema.index({ customer: 1, status: 1 });
rewardWalletSchema.index({ expiryDate: 1, status: 1 });

export default mongoose.model("RewardWallet", rewardWalletSchema, "rewardwallets");
