import SellerStore from "../models/SellerStore.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { absoluteToWebPath } from "../utils/uploadPaths.js";
import {
  applyStoreContentFromBody,
  slugFromStoreName,
} from "../utils/storeContentValidation.js";
import {
  buildStorePublicUrl,
  getPlatformStoreHost,
  getSubdomainPreview,
  validateSubdomain,
} from "../utils/storeDomain.js";
import {
  assertCanCreateStore,
  getStorePlanLimits,
} from "../utils/storePlanLimits.js";
import { logStoreActivity } from "../services/sellerActivity.service.js";
import { buildStoreSeo } from "../utils/storeSeo.js";

const SELLER_SEO_SELECT = "officialName businessName elevatorPitch organizationLogo status";

function pickStoreFile(req, fieldName) {
  const file = req.files?.[fieldName]?.[0] || (req.file?.fieldname === fieldName ? req.file : null);
  return file?.path ? absoluteToWebPath(file.path) : "";
}

async function loadSellerForStore(store) {
  if (!store?.sellerId) return null;
  const id = store.sellerId._id || store.sellerId;
  return User.findById(id).select(SELLER_SEO_SELECT).lean();
}

async function formatStoreResponse(store, seller = null) {
  if (!store) return null;
  const obj = store.toObject ? store.toObject() : { ...store };
  const host = getPlatformStoreHost();
  const sellerDoc = seller || (await loadSellerForStore(store));
  const seo = buildStoreSeo(obj, sellerDoc);

  return {
    ...obj,
    storeUrl: buildStorePublicUrl(store),
    subdomainPreview: getSubdomainPreview(store.subdomain),
    storeNameUrlPreview: `www.${host}/store/${store.subdomain || slugFromStoreName(store.storeName)}`,
    seo,
    faviconUrl: obj.favicon || obj.logo || "",
  };
}

function resolveSubdomain(body, storeName, existingSubdomain) {
  const explicit = body.subdomain;
  if (explicit && String(explicit).trim()) {
    return validateSubdomain(explicit);
  }
  const fromName = validateSubdomain(slugFromStoreName(storeName));
  if (fromName.ok) return fromName;
  if (existingSubdomain) {
    return validateSubdomain(existingSubdomain);
  }
  return fromName;
}

function planErrorPayload(error) {
  const payload = { message: error.message };
  if (error.code) payload.code = error.code;
  if (error.upgradeFeature) payload.upgradeFeature = error.upgradeFeature;
  return payload;
}

// GET /api/seller/store
export const getMyStore = async (req, res) => {
  try {
    const stores = await SellerStore.find({ sellerId: req.user._id }).sort({
      createdAt: 1,
    });
    const store = stores[0] || null;
    const plan = getStorePlanLimits(req.user);
    const storeCount = stores.length;
    const seoPreview = buildStoreSeo(
      store || { storeName: "", keywords: [], tagline: "" },
      req.user
    );
    const formattedStores = await Promise.all(
      stores.map((s) => formatStoreResponse(s, req.user))
    );
    res.json({
      store: store ? await formatStoreResponse(store, req.user) : null,
      stores: formattedStores,
      storeCount,
      hasStore: storeCount > 0,
      canCreateMoreStores: storeCount < plan.maxStores,
      maxStores: plan.maxStores,
      platformHost: getPlatformStoreHost(),
      isSubscribedSeller: plan.isSubscribedSeller,
      allowMultipleAddresses: plan.allowMultipleAddresses,
      storeAddressHint: plan.storeAddressHint,
      sellerMeta: {
        officialName: req.user.officialName || "",
        businessName: req.user.businessName || "",
        elevatorPitch: req.user.elevatorPitch || "",
      },
      seoPreview,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/seller/store
export const createStore = async (req, res) => {
  try {
    const storeCount = await SellerStore.countDocuments({ sellerId: req.user._id });
    assertCanCreateStore(req.user, storeCount);

    const content = applyStoreContentFromBody(req.body, req.user);

    const check = resolveSubdomain(req.body, content.storeName, null);
    if (!check.ok) {
      return res.status(400).json({ message: check.message });
    }
    const subdomainValue = check.value;
    const taken = await SellerStore.findOne({ subdomain: subdomainValue });
    if (taken) {
      return res.status(400).json({
        message: "This store URL is already taken. Try a different store name.",
      });
    }

    const logoPath = pickStoreFile(req, "logo");
    const faviconPath = pickStoreFile(req, "favicon");

    if (!logoPath) {
      return res.status(400).json({ message: "Store logo is required." });
    }

    const store = await SellerStore.create({
      sellerId: req.user._id,
      storeName: content.storeName,
      keywords: content.keywords,
      logo: logoPath,
      favicon: faviconPath,
      detailedAddress: content.detailedAddress,
      additionalAddresses: content.additionalAddresses,
      tagline: req.body.tagline ? String(req.body.tagline).trim() : "",
      domainType: "platform_subdomain",
      customDomain: "",
      subdomain: subdomainValue,
    });

    logStoreActivity(req.user._id, store.storeName, true);

    res.status(201).json({
      message: "Store created successfully",
      store: await formatStoreResponse(store, req.user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Store domain or subdomain is already in use.",
      });
    }
    const status = error.statusCode || 500;
    return res.status(status).json(planErrorPayload(error));
  }
};

// PUT /api/seller/store — PATCH for auto-save while editing
export const updateStore = async (req, res) => {
  try {
    const isAutosave = req.method === "PATCH";
    const storeFilter = { sellerId: req.user._id };
    if (req.body.storeId) {
      storeFilter._id = req.body.storeId;
    }
    const store = await SellerStore.findOne(storeFilter).sort({ createdAt: 1 });
    if (!store) {
      return res.status(404).json({
        message: "No store found. Create your store first.",
      });
    }

    const content = applyStoreContentFromBody(req.body, req.user, { partial: isAutosave });
    const { isActive } = req.body;

    if (content.storeName) store.storeName = content.storeName;
    if (content.keywords !== undefined) store.keywords = content.keywords;
    if (content.detailedAddress) store.detailedAddress = content.detailedAddress;
    if (content.additionalAddresses !== undefined) {
      store.additionalAddresses = content.additionalAddresses;
    }

    if (req.body.tagline !== undefined) {
      store.tagline = String(req.body.tagline).trim();
    }
    if (isActive !== undefined) {
      store.isActive = isActive === true || isActive === "true";
    }
    const logoPath = pickStoreFile(req, "logo");
    const faviconPath = pickStoreFile(req, "favicon");
    if (logoPath) store.logo = logoPath;
    if (faviconPath) store.favicon = faviconPath;

    const nameForSubdomain = content.storeName || store.storeName;
    const check = resolveSubdomain(req.body, nameForSubdomain, store.subdomain);
    if (!check.ok) {
      return res.status(400).json({ message: check.message });
    }
    const taken = await SellerStore.findOne({
      subdomain: check.value,
      _id: { $ne: store._id },
    });
    if (taken) {
      return res.status(400).json({ message: "This store URL is already taken." });
    }
    store.domainType = "platform_subdomain";
    store.subdomain = check.value;
    store.customDomain = "";

    await store.save();

    if (!isAutosave) {
      logStoreActivity(req.user._id, store.storeName, false);
    }

    res.json({
      message: isAutosave ? "Store auto-saved" : "Store updated successfully",
      autoSaved: isAutosave,
      store: await formatStoreResponse(store, req.user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Store domain or subdomain is already in use.",
      });
    }
    const status = error.statusCode || 500;
    return res.status(status).json(planErrorPayload(error));
  }
};

// GET /api/seller/store/subdomain-check?subdomain=xxx
export const checkSubdomainAvailability = async (req, res) => {
  try {
    const check = validateSubdomain(req.query.subdomain);
    if (!check.ok) {
      return res.json({ available: false, message: check.message });
    }
    const taken = await SellerStore.findOne({ subdomain: check.value });
    res.json({
      available: !taken,
      subdomain: check.value,
      preview: getSubdomainPreview(check.value),
      message: taken ? "Subdomain is already taken." : "Available",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/public/stores/:subdomain — public storefront + SEO
export const getPublicStore = async (req, res) => {
  try {
    const subdomain = String(req.params.subdomain || "")
      .trim()
      .toLowerCase();
    if (!subdomain) {
      return res.status(400).json({ message: "Store subdomain is required." });
    }

    const store = await SellerStore.findOne({ subdomain, isActive: true }).lean();
    if (!store) {
      return res.status(404).json({ message: "Store not found or is not active." });
    }

    const seller = await User.findById(store.sellerId)
      .select(SELLER_SEO_SELECT)
      .lean();

    if (!seller || seller.status !== "approved") {
      return res.status(404).json({ message: "Store is not available." });
    }

    const seo = buildStoreSeo(store, seller);
    const formatted = await formatStoreResponse(store, seller);

    const products = await Product.find({
      sellerId: store.sellerId,
      isActive: true,
      isDraft: { $ne: true },
      approvalStatus: "approved",
    })
      .select("title price images category stock")
      .sort({ createdAt: -1 })
      .limit(48)
      .lean();

    res.json({
      store: formatted,
      seo,
      products,
      productCount: products.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
