import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    compareAtPrice: {
      type: Number,
      min: 0,
    },

    unitPrice: {
      type: Number,
      min: 0,
    },

    chargeTax: {
      type: Boolean,
      default: false,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    locations: {
      type: [
        {
          address: { type: String, required: true },
          stock: { type: Number, required: true, min: 0 },
        }
      ],
      default: [],
    },

    inventoryTracked: {
      type: Boolean,
      default: true,
    },

    sku: {
      type: String,
      default: "",
    },

    barcode: {
      type: String,
      default: "",
    },

    continueSellingWhenOutOfStock: {
      type: Boolean,
      default: false,
    },

    isPhysicalProduct: {
      type: Boolean,
      default: true,
    },

    packageType: {
      type: String,
      default: "Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg",
    },

    packageLength: {
      type: Number,
    },

    packageWidth: {
      type: Number,
    },

    packageHeight: {
      type: Number,
    },

    packageDimensionsUnit: {
      type: String,
      enum: ["cm", "in"],
      default: "cm",
    },

    productWeight: {
      type: Number,
      default: 0,
    },

    productWeightUnit: {
      type: String,
      enum: ["g", "kg", "lb", "oz"],
      default: "g",
    },

    pageTitle: {
      type: String,
      maxlength: 70,
    },

    metaDescription: {
      type: String,
      maxlength: 160,
    },

    urlHandle: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ✅ NEW: PRODUCT APPROVAL SYSTEM
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);