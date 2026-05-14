import mongoose from "mongoose";

const bulkInquirySchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },
    buyerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    buyerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    quantityRequired: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Negotiation Pending", "Meeting Scheduled", "Completed", "Cancelled"],
      default: "Negotiation Pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BulkInquiry", bulkInquirySchema);
