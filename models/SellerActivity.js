import mongoose from "mongoose";

const sellerActivitySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    link: {
      type: String,
      default: "",
      trim: true,
      maxlength: 300,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

sellerActivitySchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model("SellerActivity", sellerActivitySchema);
