import mongoose from "mongoose";

const rewardSettingsSchema = new mongoose.Schema(
  {
    // Singleton key
    _singleton: {
      type: String,
      default: "global",
      unique: true,
    },
    // Global on/off
    rewardsEnabled: {
      type: Boolean,
      default: true,
    },
    // Default voucher expiry (days) used if campaign doesn't specify
    defaultVoucherExpiryDays: {
      type: Number,
      default: 30,
    },
    // Max active vouchers a customer can hold at once (0 = unlimited)
    maxActiveVouchersPerCustomer: {
      type: Number,
      default: 0,
    },
    // Max reward balance a customer can accumulate
    maxRewardBalancePerCustomer: {
      type: Number,
      default: 0,
    },
    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("RewardSettings", rewardSettingsSchema, "rewardsettings");
