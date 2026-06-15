import mongoose from "mongoose";

const storeConfigSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      unique: true,
      index: true,
    },
    themeId: {
      type: String,
      default: "light",
    },
    accentColor: {
      type: String,
      default: "#F59E0B",
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    bannerTitle: {
      type: String,
      default: "",
    },
    bannerSubtitle: {
      type: String,
      default: "",
    },
    tickerEnabled: {
      type: Boolean,
      default: true,
    },
    tickerText: {
      type: String,
      default: "",
    },
    promoBannerEnabled: {
      type: Boolean,
      default: false,
    },
    promoBannerText: {
      type: String,
      default: "",
    },
    gridColumns: {
      type: Number,
      default: 4,
    },
    hideOutOfStock: {
      type: Boolean,
      default: false,
    },
    showRatings: {
      type: Boolean,
      default: true,
    },
    blocks: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("StoreConfig", storeConfigSchema);
