import mongoose from "mongoose";

const adminVoucherSchema = new mongoose.Schema(
  {
    voucherType: {
      type: String,
      enum: ["seller_subscription", "customer_all", "customer_specific", "seller_products"],
      required: true,
    },
    voucherCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percent", "flat"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    expiry: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    note: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Specific settings depending on voucher type:
    // 1. For seller_subscription:
    selectedPlans: [
      {
        type: String,
        enum: ["free", "pro", "premium"],
      },
    ],
    // 2. For customer_specific:
    selectedProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    // 3. For seller_products:
    selectedSellers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Seller",
      },
    ],
    sellerProductScope: {
      type: String,
      enum: ["all", "specific"],
      default: "all",
    },
    // Map of sellerId to array of product name strings (as per react mock)
    sellerSpecificProducts: {
      type: Map,
      of: [String],
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdminVoucher", adminVoucherSchema);
