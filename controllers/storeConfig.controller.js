import StoreConfig from "../models/StoreConfig.js";
import SellerStore from "../models/SellerStore.js";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import { isSubscribedSeller } from "../utils/productInventoryRules.js";

// Helper to get default customizable layout
const getDefaultCustomizableLayout = (storeName, tagline) => {
  return {
    themeId: "light",
    accentColor: "#F59E0B",
    bannerTitle: storeName || "Welcome to Our Store",
    bannerSubtitle: tagline || "Handcrafted with love",
    tickerEnabled: true,
    tickerText: "Welcome to our customized online store! Check out our latest products.",
    promoBannerEnabled: false,
    promoBannerText: "",
    gridColumns: 4,
    hideOutOfStock: false,
    showRatings: true,
    blocks: [
      { id: "b1", type: "section_products", visible: true, label: "Featured Products", config: { sectionType: "featured", productIds: [], collections: [] } },
      { id: "b2", type: "category_nav", visible: true, label: "Category Navigator", config: { categories: [] } },
      { id: "b3", type: "spotlight", visible: true, label: "Spotlight Product", config: { imageUrl: "", imagePosition: "right", title: "", subtitle: "", buttonType: "cart", productId: null } },
      { id: "b4", type: "bulk_row", visible: true, label: "Bulk Order Products", config: { productOrder: [] } },
      { id: "b5", type: "reviews", visible: true, label: "Customer Reviews", config: { reviews: [] } }
    ]
  };
};

// Helper to get default free layout
const getDefaultFreeLayout = () => {
  return {
    themeId: "light",
    accentColor: "#F59E0B",
    bannerTitle: "",
    bannerSubtitle: "",
    tickerEnabled: false,
    tickerText: "",
    promoBannerEnabled: false,
    promoBannerText: "",
    gridColumns: 4,
    hideOutOfStock: false,
    showRatings: true,
    blocks: [] // Empty blocks, forces default product listing with basic filters
  };
};

export const getSellerStoreConfig = async (req, res) => {
  try {
    const sellerId = req.user._id;
    let config = await StoreConfig.findOne({ sellerId });

    if (!config) {
      const seller = await Seller.findById(sellerId);
      const isSubscribed = isSubscribedSeller(seller);
      const store = await SellerStore.findOne({ sellerId });

      let defaultLayout;
      if (isSubscribed) {
        defaultLayout = getDefaultCustomizableLayout(store?.storeName, store?.tagline);
      } else {
        defaultLayout = getDefaultFreeLayout();
      }

      config = new StoreConfig({
        sellerId,
        ...defaultLayout
      });
      // Do not save it yet, just return it so they see the unsaved preview of default
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSellerStoreConfig = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const seller = await Seller.findById(sellerId);
    const isSubscribed = isSubscribedSeller(seller);

    const {
      themeId,
      accentColor,
      bannerUrl,
      bannerTitle,
      bannerSubtitle,
      tickerEnabled,
      tickerText,
      promoBannerEnabled,
      promoBannerText,
      gridColumns,
      hideOutOfStock,
      showRatings,
      blocks
    } = req.body;

    if (!isSubscribed) {
      // Free seller validations
      // 1. Free seller cannot save paid blocks like bulk_row, spotlight, reviews, collections, or advanced customization.
      if (blocks && blocks.length > 0) {
        const hasPaidBlocks = blocks.some(b => 
          ["bulk_row", "spotlight", "reviews", "category_nav"].includes(b.type) || 
          (b.type === "section_products" && b.config?.sectionType === "collections")
        );
        if (hasPaidBlocks) {
          return res.status(403).json({
            message: "Bulk Order and advanced blocks are available only for paid subscribers.",
            code: "PREMIUM_REQUIRED",
            upgradeFeature: "premium"
          });
        }
      }

      // 2. Free seller cannot customize theme settings, banners, tickers
      if (themeId && themeId !== "light") {
        return res.status(403).json({
          message: "Theme color customization is available only for paid subscribers.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "premium"
        });
      }

      if (accentColor && accentColor !== "#F59E0B" && accentColor !== "#f59e0b") {
        return res.status(403).json({
          message: "Accent color customization is available only for paid subscribers.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "premium"
        });
      }

      if (bannerUrl || bannerTitle || bannerSubtitle) {
        return res.status(403).json({
          message: "Store banner customization is available only for paid subscribers.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "premium"
        });
      }

      if (tickerEnabled === true || promoBannerEnabled === true) {
        return res.status(403).json({
          message: "Ticker and promotional banner are available only for paid subscribers.",
          code: "PREMIUM_REQUIRED",
          upgradeFeature: "premium"
        });
      }
    }

    let config = await StoreConfig.findOne({ sellerId });
    if (!config) {
      config = new StoreConfig({ sellerId });
    }

    if (themeId !== undefined) config.themeId = themeId;
    if (accentColor !== undefined) config.accentColor = accentColor;
    if (bannerUrl !== undefined) config.bannerUrl = bannerUrl;
    if (bannerTitle !== undefined) config.bannerTitle = bannerTitle;
    if (bannerSubtitle !== undefined) config.bannerSubtitle = bannerSubtitle;
    if (tickerEnabled !== undefined) config.tickerEnabled = tickerEnabled;
    if (tickerText !== undefined) config.tickerText = tickerText;
    if (promoBannerEnabled !== undefined) config.promoBannerEnabled = promoBannerEnabled;
    if (promoBannerText !== undefined) config.promoBannerText = promoBannerText;
    if (gridColumns !== undefined) config.gridColumns = gridColumns;
    if (hideOutOfStock !== undefined) config.hideOutOfStock = hideOutOfStock;
    if (showRatings !== undefined) config.showRatings = showRatings;
    if (blocks !== undefined) config.blocks = blocks;

    await config.save();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStoreConfigPublic = async (req, res) => {
  try {
    const handle = String(req.params.sellerHandle || "").trim().toLowerCase();

    // Find the store
    const store = await SellerStore.findOne({
      $or: [
        { storeSlug: handle },
        { subdomain: handle },
        { customDomain: handle }
      ],
      isActive: true
    });

    if (!store) {
      return res.status(404).json({ message: "Store not found or is inactive." });
    }

    const seller = await Seller.findById(store.sellerId);
    if (!seller || seller.status !== "approved") {
      return res.status(404).json({ message: "Seller store is not available." });
    }

    let config = await StoreConfig.findOne({ sellerId: store.sellerId });
    const isSubscribed = isSubscribedSeller(seller);

    if (!config) {
      let defaultLayout;
      if (isSubscribed) {
        defaultLayout = getDefaultCustomizableLayout(store.storeName, store.tagline);
      } else {
        defaultLayout = getDefaultFreeLayout();
      }
      config = {
        sellerId: store.sellerId,
        ...defaultLayout
      };
    }

    // Load active seller products
    const products = await Product.find({
      sellerId: store.sellerId,
      isActive: true,
      isDraft: { $ne: true },
      approvalStatus: "approved",
    }).lean();

    res.json({
      store: {
        _id: store._id,
        storeName: store.storeName,
        logo: store.logo,
        favicon: store.favicon,
        detailedAddress: store.detailedAddress,
        tagline: store.tagline,
        storeUrl: store.storeUrl,
        subdomain: store.subdomain,
      },
      isSubscribedSeller: isSubscribed,
      config,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
