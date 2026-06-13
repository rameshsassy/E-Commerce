import mongoose from "mongoose";
import { BUYER_TYPE_OPTIONS } from "../utils/bulkInquiryConstants.js";

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
      required: false,
      index: true,
    },
    productTitle: {
      type: String,
      trim: true,
    },
    productPrice: {
      type: String,
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    productMinQty: {
      type: Number,
    },
    /** Display id: sequence + DDMMYYYY — e.g. 0328052025 */
    displayBulkRequestId: { type: String, trim: true, index: true },
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
    buyerCity: {
      type: String,
      trim: true,
      default: "",
    },
    companyOrganisation: {
      type: String,
      trim: true,
      default: "",
    },
    quantityRequired: {
      type: String,
      required: true,
      trim: true,
    },
    variantLines: [
      {
        label: { type: String, trim: true },
        quantity: { type: String, trim: true },
      },
    ],
    estimatedCost: {
      type: Number,
      min: 0,
      default: null,
    },
    requestedDeliveryDate: {
      type: Date,
      default: null,
    },
    deliveryLeadDays: {
      type: Number,
      default: 30,
    },
    buyerType: {
      type: String,
      enum: BUYER_TYPE_OPTIONS,
    },
    buyerTypeUpdatedAt: {
      type: Date,
      default: null,
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
    sellerOrderStatus: {
      type: String,
      enum: [
        "Accept Order",
        "Reject Order",
        "Order Dispatched",
        "Order Shipped",
        "Order in Transit",
        "Product Delivered",
      ],
    },
    statusTimeline: {
      orderPlaced: { type: Date },
      orderAccepted: { type: Date },
      orderDispatched: { type: Date },
      orderShipped: { type: Date },
      orderInTransit: { type: Date },
      orderDelivered: { type: Date },
      estimatedDelivery: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("BulkInquiry", bulkInquirySchema);
