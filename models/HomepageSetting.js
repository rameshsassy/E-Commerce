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
      url: { type: String, default: "/brand/aashansh-logo.png" },
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
      scrolling: { type: Boolean, default: true },
      text: {
        type: String,
        default: "conscious, inclusive, and impactful consumption",
      },
      backgroundColor: { type: String, default: "#ffd401" },
      textColor: { type: String, default: "#000000" },
    },
    heroBanner: {
      enabled: { type: Boolean, default: true },
      image: { type: String, default: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80" },
      headlineEnabled: { type: Boolean, default: true },
      headline: { type: String, default: "Authentic. Ethical. Empowering." },
      headlineAlignment: {
        type: String,
        enum: ["left", "center", "right"],
        default: "center",
      },
      subtitleEnabled: { type: Boolean, default: true },
      subtitle: {
        type: String,
        default: "Crafted with Purpose, Delivered with Heart ❤️",
      },
      ctaEnabled: { type: Boolean, default: true },
      ctaText: { type: String, default: "SHOP NOW" },
      ctaLink: { type: String, default: "/products" },
      ctaColor: { type: String, default: "#ffd401" },
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomepageSetting", homepageSettingSchema);
