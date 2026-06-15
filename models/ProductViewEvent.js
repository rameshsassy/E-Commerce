import mongoose from "mongoose";

const productViewEventSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      index: true,
    },
    visitorHash: {
      type: String,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent storing multiple view events for the same visitor on the same product per day
productViewEventSchema.index(
  { productId: 1, visitorHash: 1, createdAt: 1 },
  { partialFilterExpression: { visitorHash: { $type: "string" } } }
);
productViewEventSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model("ProductViewEvent", productViewEventSchema);

