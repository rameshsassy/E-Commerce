import mongoose from "mongoose";

const cartAddEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    source: {
      type: String,
      default: "cart",
      trim: true,
    },
  },
  { timestamps: true }
);

cartAddEventSchema.index({ sellerId: 1, createdAt: -1 });

export default mongoose.model("CartAddEvent", cartAddEventSchema);

