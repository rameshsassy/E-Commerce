import mongoose from "mongoose";

const sellerStoreSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: (v) => !v || v.length <= 5,
        message: "Maximum 5 keywords allowed",
      },
    },

    logo: {
      type: String,
      default: "",
    },

    favicon: {
      type: String,
      default: "",
    },

    detailedAddress: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    additionalAddresses: {
      type: [String],
      default: [],
    },

    tagline: {
      type: String,
      trim: true,
      default: "",
    },

    domainType: {
      type: String,
      enum: ["own_domain", "platform_subdomain"],
      required: true,
    },

    /** e.g. shop.mybrand.com — used when domainType is own_domain */
    customDomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    /** e.g. my-shop — used when domainType is platform_subdomain */
    subdomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

sellerStoreSchema.index(
  { subdomain: 1 },
  { unique: true, sparse: true, partialFilterExpression: { subdomain: { $type: "string", $ne: "" } } }
);

sellerStoreSchema.index(
  { customDomain: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { customDomain: { $type: "string", $ne: "" } },
  }
);

export default mongoose.model("SellerStore", sellerStoreSchema);
