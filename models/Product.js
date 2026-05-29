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
      maxlength: 1200,
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20000,
    },

    keywords: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    /**
     * Product variants (e.g., same shirt different color/size/etc).
     * Each variant can optionally carry its own image and pricing fields.
     */
    variants: {
      type: [
        {
          type: {
            type: String,
            enum: ["color", "size", "material", "pattern", "weight", "custom"],
            required: true,
          },
          value: { type: String, required: true, trim: true, maxlength: 200 },
          colorHex: {
            type: String,
            trim: true,
            uppercase: true,
            match: /^#([0-9A-F]{3}|[0-9A-F]{6})$/,
          },
          price: { type: Number, min: 0 },
          compareAtPrice: { type: Number, min: 0 },
          sku: { type: String, default: "" },
          dispatchDeliveryDays: { type: Number, min: 0 },
          image: { type: String, default: "" },
        },
      ],
      default: [],
    },

    policies: {
      return: {
        enabled: { type: Boolean, default: false },
        terms: { type: String, default: "", maxlength: 150, trim: true },
      },
      replacement: {
        enabled: { type: Boolean, default: false },
        terms: { type: String, default: "", maxlength: 150, trim: true },
      },
      refund: {
        enabled: { type: Boolean, default: false },
        terms: { type: String, default: "", maxlength: 150, trim: true },
      },
    },

    careInstructions: {
      type: String,
      default: "",
      maxlength: 20000,
    },

    keyHighlights: {
      type: String,
      default: "",
      maxlength: 20000,
    },

    dispatchDeliveryDays: {
      type: Number,
      min: 0,
    },

    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    maxOrderQuantity: {
      type: Number,
      default: 5,
      min: 1,
    },

    // Premium: Bulk Purchase / B2B
    bulkPurchaseEnabled: {
      type: Boolean,
      default: false,
    },

    bulkPurchaseMinOrderQuantity: {
      type: Number,
      default: 50,
      min: 1,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    /** Premium: Type (subcategory refinement) */
    premiumType: {
      type: String,
      trim: true,
      default: "",
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

    purchaseType: {
      type: String,
      enum: ["one_time", "subscription", "custom_order"],
      default: "one_time",
    },

    /** Store addresses (from seller KYC) this product ships from */
    shipFromStoreAddresses: {
      type: [String],
      default: [],
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

    /** Shipping delivery scope: pincode | city | state | all_india */
    deliveryBy: {
      type: String,
      enum: ["pincode", "city", "state", "all_india"],
    },

    deliveryValues: {
      type: [String],
      default: [],
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

    // Draft saved via auto-save before final submit
    isDraft: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ✅ PRODUCT APPROVAL SYSTEM
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