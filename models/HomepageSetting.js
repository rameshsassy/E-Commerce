import mongoose from "mongoose";

const homepageSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "header_settings",
    },
    logo: {
      url: { type: String, default: "" },
      enabled: { type: Boolean, default: true },
    },
    bulkPurchase: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: "Bulk Purchase" },
      link: { type: String, default: "/bulk-purchase" },
    },
    searchBar: {
      enabled: { type: Boolean, default: true },
      placeholder: { type: String, default: "Search products, brands, categories..." },
    },
    cartIcon: {
      enabled: { type: Boolean, default: true },
    },
    accountMenu: {
      enabled: { type: Boolean, default: true },
    },
    announcementBar: {
      enabled: { type: Boolean, default: true },
      text: {
        type: String,
        default: "Welcome to Aashansh! Discover amazing products and offers.",
      },
      backgroundColor: { type: String, default: "#000000" },
      textColor: { type: String, default: "#ffffff" },
    },
    heroBanner: {
      enabled: { type: Boolean, default: true },
      image: { type: String, default: "" },
      headlineEnabled: { type: Boolean, default: true },
      headline: { type: String, default: "Discover Products Made for You" },
      headlineAlignment: {
        type: String,
        enum: ["left", "center", "right"],
        default: "center",
      },
      subtitleEnabled: { type: Boolean, default: true },
      subtitle: {
        type: String,
        default: "Shop from trusted sellers across Aashansh.",
      },
      ctaEnabled: { type: Boolean, default: true },
      ctaText: { type: String, default: "Shop Now" },
      ctaLink: { type: String, default: "/products" },
      ctaColor: { type: String, default: "#ffd401" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomepageSetting", homepageSettingSchema);
