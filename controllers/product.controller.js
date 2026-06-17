import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Seller from "../models/Seller.js";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import crypto from "crypto";
import ExcelJS from "exceljs";
import { SELLER_MAIN_CATEGORIES } from "../data/sellerMainCategories.js";
import { getCategoryTaxonomyForApi } from "../data/sellerCategoryTaxonomy.js";
import { ensureUploadsRoot, absoluteToWebPath, getUploadsRoot } from "../utils/uploadPaths.js";
import { optimizeImageBuffer } from "../utils/imageOptimizer.js";
import ProductViewEvent from "../models/ProductViewEvent.js";
import {
  applyProductFields,
  getUploadedImagePaths,
  getUploadedFieldFilePaths,
  parseExistingImagePaths,
  parseLocations,
  parseKeywords,
  sanitizeDescription,
} from "../utils/productFields.js";
import {
  validateProductDescription,
  validateProductTitle,
} from "../utils/productContentValidation.js";
import {
  resolveSellerCategory,
  validateBulkProductCategories,
} from "../utils/sellerCategoryRules.js";
import { resolveListPagination } from "../utils/listPagination.js";
import {
  AASHANSH_FAVICON_PATH,
  buildCategoryPageSeo,
  buildCategoryProductFilter,
  resolveCategoryParams,
} from "../utils/categoryPageSeo.js";
import { PLAN_ERROR_CODE, createPremiumRequiredError } from "../utils/storePlanLimits.js";
import {
  logProductCreated,
  logProductUpdated,
  logProductDeleted,
  logBulkProductUpload,
} from "../services/sellerActivity.service.js";
import { isGoogleDriveConfigured, uploadFileToDrive } from "../services/googleDrive.service.js";

const MAX_PRODUCT_IMAGES = 5;
import {
  assertProductEditable,
  sendProductLockedResponse,
} from "../middleware/productEdit.middleware.js";
import {
  ALL_INDIA_REGIONS,
  filterSuggestionsStartsWith,
  filterSuggestionsStartsWithLimited,
  getIndianCities,
  getIndianStates,
  DELIVERY_BY_OPTIONS,
} from "../data/indiaLocations.js";

ensureUploadsRoot();

function sendPlanErrorResponse(res, err) {
  const status = err.statusCode || 500;
  const payload = { message: err.message };
  if (err.code) payload.code = err.code;
  if (err.upgradeFeature) payload.upgradeFeature = err.upgradeFeature;
  if (err.autoRedirect) payload.autoRedirect = true;
  return res.status(status).json(payload);
}

async function applyCategoryPlanToBody(req, product = null) {
  if (req.body.category === undefined && req.body.premiumType === undefined) {
    return;
  }
  const resolved = await resolveSellerCategory(
    req.user,
    req.body.category !== undefined ? req.body.category : product?.category,
    {
      excludeProductId: product?._id,
      premiumType: req.body.premiumType,
    }
  );
  req.body.category = resolved.category;
  if (resolved.premiumType !== undefined) {
    req.body.premiumType = resolved.premiumType;
  }
}

// ===============================
// 💾 AUTO-SAVE PRODUCT DRAFT
// ===============================
export const autoSaveProduct = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete KYC and get approval to manage products",
      });
    }

    let product;

    if (req.params.id) {
      product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      if (product.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
      try {
        assertProductEditable(product);
      } catch (err) {
        return sendProductLockedResponse(res, err);
      }
    } else {
      product = await Product.findOne({
        sellerId: req.user._id,
        isDraft: true,
      });

      if (!product) {
        product = new Product({
          sellerId: req.user._id,
          title: "Untitled draft",
          description: "",
          price: 0,
          category: "Uncategorized",
          isDraft: true,
          approvalStatus: "pending",
        });
      }
    }

    try {
      await applyCategoryPlanToBody(req, product);
    } catch (err) {
      if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
      throw err;
    }

    applyProductFields(product, req.body, { partial: true, seller: req.user });

    // Map uploaded variant images to variants without an image yet.
    // (This mirrors the behavior in addProduct/updateProduct so autosave drafts
    // don’t lose variant images.)
    const variantImagePaths = getUploadedFieldFilePaths(req, "variantImages");
    if (variantImagePaths.length > 0 && Array.isArray(product.variants)) {
      let idx = 0;
      product.variants = product.variants.map((v) => {
        if (idx >= variantImagePaths.length) return v;
        if (v && (!v.image || String(v.image).trim() === "")) {
          const next = { ...v, image: variantImagePaths[idx] };
          idx += 1;
          return next;
        }
        return v;
      });
    }

    const newImages = getUploadedImagePaths(req);
    if (newImages) {
      product.images = [...(product.images || []), ...newImages];
    }

    if (!product.isDraft && product._id) {
      // Editing a published product — keep it live, only persist field changes.
    } else {
      product.isDraft = true;
    }
    await product.save();

    res.json({
      message: "Product details auto-saved",
      autoSaved: true,
      product,
    });
  } catch (error) {
    if (error.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// ===============================
// ➕ ADD PRODUCT (WITH APPROVAL)
// ===============================
export const addProduct = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete KYC and get approval to add products",
      });
    }

    const { draftId } = req.body;
    const { title, description, price, category } = req.body;

    if (!title || !description || price === undefined || price === "") {
      return res.status(400).json({
        message: "Title, description, and price are required",
      });
    }

    try {
      validateProductTitle(title);
      validateProductDescription(description);
    } catch (err) {
      return res.status(err.statusCode || 400).json({ message: err.message });
    }

    let categoryValue =
      category != null && String(category).trim() !== ""
        ? String(category).trim()
        : "Uncategorized";

    let product;

    if (draftId) {
      product = await Product.findOne({
        _id: draftId,
        sellerId: req.user._id,
        isDraft: true,
      });
      if (!product) {
        return res.status(404).json({ message: "Draft not found" });
      }
      try {
        assertProductEditable(product);
      } catch (err) {
        return sendProductLockedResponse(res, err);
      }
    }

    try {
      const resolved = await resolveSellerCategory(req.user, categoryValue, {
        excludeProductId: product?._id,
        premiumType: req.body.premiumType,
      });
      categoryValue = resolved.category;
      req.body.category = resolved.category;
      if (resolved.premiumType !== undefined) {
        req.body.premiumType = resolved.premiumType;
      }
    } catch (err) {
      if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
      throw err;
    }

    const imagePaths = getUploadedImagePaths(req, "images") || [];
    if (imagePaths.length > MAX_PRODUCT_IMAGES) {
      return res.status(400).json({
        message: `Maximum ${MAX_PRODUCT_IMAGES} images allowed per product.`,
      });
    }

    // Variant images (optional)
    const variantImagePaths = getUploadedFieldFilePaths(req, "variantImages");

    const { locations: parsedLocations, stock: totalStock } = parseLocations(
      req.body.locations,
      req.body.stock
    );

    const keywordArray = parseKeywords(req.body.keywords) || [];

    if (product) {
      applyProductFields(product, req.body, {
        seller: req.user,
        requireStoreAddress: true,
      });
      product.images = imagePaths.length > 0 ? imagePaths : product.images;

      // Map uploaded variant images in-order onto variants with empty image
      if (variantImagePaths.length > 0 && Array.isArray(product.variants)) {
        let idx = 0;
        product.variants = product.variants.map((v) => {
          if (idx >= variantImagePaths.length) return v;
          if (v && (!v.image || String(v.image).trim() === "")) {
            const next = { ...v, image: variantImagePaths[idx] };
            idx += 1;
            return next;
          }
          return v;
        });
      }

      product.category = categoryValue;
      product.stock = totalStock;
      product.locations = parsedLocations;
      product.keywords = keywordArray;
      product.isDraft = false;
      product.approvalStatus = "pending";
      await product.save();
    } else {
      const draftProduct = new Product({
        sellerId: req.user._id,
        title,
        description: sanitizeDescription(description),
        price: Number(price),
        compareAtPrice: req.body.compareAtPrice
          ? Number(req.body.compareAtPrice)
          : undefined,
        unitPrice: req.body.unitPrice ? Number(req.body.unitPrice) : undefined,
        chargeTax:
          req.body.chargeTax === "true" || req.body.chargeTax === true,
        stock: totalStock,
        locations: parsedLocations,
        inventoryTracked:
          req.body.inventoryTracked === "true" ||
          req.body.inventoryTracked === true,
        sku: req.body.sku || "",
        barcode: req.body.barcode || "",
        continueSellingWhenOutOfStock:
          req.body.continueSellingWhenOutOfStock === "true" ||
          req.body.continueSellingWhenOutOfStock === true,
        isPhysicalProduct:
          req.body.isPhysicalProduct === undefined
            ? true
            : req.body.isPhysicalProduct === "true" ||
              req.body.isPhysicalProduct === true,
        packageType:
          req.body.packageType ||
          "Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg",
        packageLength: req.body.packageLength
          ? Number(req.body.packageLength)
          : undefined,
        packageWidth: req.body.packageWidth
          ? Number(req.body.packageWidth)
          : undefined,
        packageHeight: req.body.packageHeight
          ? Number(req.body.packageHeight)
          : undefined,
        packageDimensionsUnit: req.body.packageDimensionsUnit || "cm",
        productWeight: req.body.productWeight
          ? Number(req.body.productWeight)
          : 0,
        productWeightUnit: req.body.productWeightUnit || "g",
        pageTitle: req.body.pageTitle || title.substring(0, 70),
        metaDescription: req.body.metaDescription || "",
        urlHandle:
          req.body.urlHandle ||
          title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, ""),
        category: categoryValue,
        keywords: keywordArray,
        images: imagePaths,
        isDraft: false,
        approvalStatus: "pending",
      });
      applyProductFields(draftProduct, req.body, {
        seller: req.user,
        requireStoreAddress: true,
      });

      // Map uploaded variant images in-order onto variants with empty image
      if (variantImagePaths.length > 0 && Array.isArray(draftProduct.variants)) {
        let idx = 0;
        draftProduct.variants = draftProduct.variants.map((v) => {
          if (idx >= variantImagePaths.length) return v;
          if (v && (!v.image || String(v.image).trim() === "")) {
            const next = { ...v, image: variantImagePaths[idx] };
            idx += 1;
            return next;
          }
          return v;
        });
      }

      product = await draftProduct.save();
    }

    // Remove any other stale drafts for this seller
    await Product.deleteMany({
      sellerId: req.user._id,
      isDraft: true,
      _id: { $ne: product._id },
    });

    logProductCreated(req.user._id, product);

    res.status(201).json({
      message: "Product submitted for admin approval",
      product,
    });
  } catch (error) {
    if (error.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// ===============================
// 🏷️ CATEGORY PAGE SEO (public)
// ===============================
export const getCategoryPageSeo = async (req, res) => {
  try {
    const resolved = resolveCategoryParams(req.query);
    const seo = buildCategoryPageSeo(resolved);
    res.json({
      seo,
      category: resolved,
      faviconPath: AASHANSH_FAVICON_PATH,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔍 INSTANT SEARCH SUGGESTIONS (public)
// ===============================
export const getSearchSuggestions = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q || !q.trim()) {
      return res.json({ products: [], categories: [], brands: [] });
    }

    const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapeRegex(q.trim()), "i");

    // 1. Fetch matching products
    const products = await Product.find({
      title: regex,
      isActive: true,
      isDraft: { $ne: true },
      approvalStatus: "approved",
    })
      .select("title _id category images price")
      .limit(5);

    // 2. Fetch matching categories
    const categoriesObj = await Category.find({
      name: regex,
      isActive: true,
    })
      .select("name slug _id")
      .limit(5);

    // 3. Fetch matching brands (sellers)
    const sellers = await Seller.find({
      businessName: regex,
      status: "approved",
    })
      .select("businessName _id")
      .limit(5);

    res.json({
      products,
      categories: categoriesObj.map((c) => ({ _id: c._id, name: c.name, slug: c.slug })),
      brands: sellers.map((s) => ({ _id: s._id, name: s.businessName })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET ALL PRODUCTS (FULL FIX)
// ===============================
export const getAllProducts = async (req, res) => {
  try {
    // Accept both 'keyword' (legacy) and 'search' (customer frontend) as search param
    const searchTerm = req.query.keyword || req.query.search || "";

    const {
      category: categoryParam,
      main,
      sub,
      type,
      minPrice,
      maxPrice,
      seller,
      sort,
      page: pageQuery,
      limit: limitQuery,
    } = req.query;

    // If category looks like a MongoDB ObjectId, resolve it to its name string
    // (Customer frontend sends the ObjectId from categoryApi.list())
    let resolvedCategoryName = categoryParam;
    const isMongoId = categoryParam && /^[a-f\d]{24}$/i.test(String(categoryParam));
    if (isMongoId) {
      const foundCat = await Category.findById(categoryParam).select("name").lean();
      resolvedCategoryName = foundCat ? foundCat.name : categoryParam;
    }

    const resolvedCategory = resolveCategoryParams({
      main,
      sub,
      type,
      category: resolvedCategoryName,
    });

    let query = {
      sellerId: { $ne: null },
      isActive: true,
      isDraft: { $ne: true },
      approvalStatus: "approved",
    };

    if (req.query.bulkPurchaseEnabled === "true") {
      query.bulkPurchaseEnabled = true;
    }

    if (searchTerm) {
      query.$or = [
        { title: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { keywords: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const categoryFilter = buildCategoryProductFilter({
      main: resolvedCategory.main,
      sub: resolvedCategory.sub,
      type: resolvedCategory.type,
      legacyCategory: resolvedCategoryName,
    });
    if (categoryFilter && Object.keys(categoryFilter).length > 0) {
      Object.assign(query, categoryFilter);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (req.subdomainStore) {
      query.sellerId = req.subdomainStore.sellerId;
    } else if (seller) {
      query.sellerId = seller;
    }

    const { page: pageNumber, limit: limitNumber, skip } = resolveListPagination(
      req,
      { page: pageQuery, limit: limitQuery },
      { defaults: { mobile: 12, tablet: 16, desktop: 20 } }
    );

    // Normalize sort values — support both legacy (price-low) and customer (price_asc) formats
    let sortObj = { createdAt: -1 };
    if (sort === "price-low" || sort === "price_asc") sortObj = { price: 1 };
    else if (sort === "price-high" || sort === "price_desc") sortObj = { price: -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "rating") sortObj = { averageRating: -1, createdAt: -1 };

    const products = await Product.find(query)
      .populate({
        path: "sellerId",
        match: { status: "approved" },
        select: "firstName lastName businessName email",
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber);

    const filteredProducts = products.filter((p) => p.sellerId !== null);

    const total = await Product.countDocuments(query);

    const categorySeo = buildCategoryPageSeo(resolvedCategory);

    res.json({
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      count: filteredProducts.length,
      products: filteredProducts,
      category: resolvedCategory,
      categorySeo,
      faviconPath: AASHANSH_FAVICON_PATH,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 BULK UPLOAD PRODUCTS (FIXED)
// ===============================
export const bulkUploadProducts = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Not approved seller",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "CSV file required",
      });
    }

    const rows = [];

    // Helper to map flexible CSV headers to our schema keys
    const mapCsvRow = (row) => {
      const normalizedRow = {};
      for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.toLowerCase().trim();
        const strVal = String(value || '').trim();

        if (lowerKey === 'product title' || lowerKey === 'title' || lowerKey === 'product name' || lowerKey === 'name') {
          normalizedRow.title = strVal;
        } else if (lowerKey === 'product description' || lowerKey === 'description') {
          normalizedRow.description = strVal;
        } else if (lowerKey === 'image link' || lowerKey === 'imagelinks' || lowerKey === 'image links' || lowerKey === 'images') {
          normalizedRow.imageLinks = strVal;
        } else if (lowerKey === 'return') {
          normalizedRow.returnEnabled = strVal;
        } else if (lowerKey === 'terms of return') {
          normalizedRow.returnTerms = strVal;
        } else if (lowerKey === 'refund') {
          normalizedRow.refundEnabled = strVal;
        } else if (lowerKey === 'terms of refund') {
          normalizedRow.refundTerms = strVal;
        } else if (lowerKey === 'replacement') {
          normalizedRow.replacementEnabled = strVal;
        } else if (lowerKey === 'terms of replacement') {
          normalizedRow.replacementTerms = strVal;
        } else if (lowerKey === 'care instructions' || lowerKey === 'care instructions ') {
          normalizedRow.careInstructions = strVal;
        } else if (lowerKey === 'key highlight/usp' || lowerKey === 'key highlight' || lowerKey === 'keyhighlights' || lowerKey === 'key highlights') {
          normalizedRow.keyHighlights = strVal;
        } else if (lowerKey === 'price' || lowerKey === 'cost' || lowerKey === 'mrp') {
          normalizedRow.price = strVal;
        } else if (lowerKey === 'discounted price' || lowerKey === 'discounted' || lowerKey === 'compare at price') {
          normalizedRow.compareAtPrice = strVal;
        } else if (lowerKey === 'sku (stock keeping unit)' || lowerKey === 'sku') {
          normalizedRow.sku = strVal;
        } else if (lowerKey === 'dispatch and delivery time' || lowerKey === 'dispatch delivery days' || lowerKey === 'delivery days') {
          normalizedRow.dispatchDeliveryDays = strVal;
        } else if (lowerKey === 'minimum order quantity' || lowerKey === 'min order quantity' || lowerKey === 'minorderquantity') {
          normalizedRow.minOrderQuantity = strVal;
        } else if (lowerKey === 'maximum order quantity' || lowerKey === 'max order quantity' || lowerKey === 'maxorderquantity') {
          normalizedRow.maxOrderQuantity = strVal;
        } else if (lowerKey === 'purchase type' || lowerKey === 'purchasetype') {
          normalizedRow.purchaseType = strVal;
        } else if (lowerKey === 'store address') {
          normalizedRow.shipFromStoreAddresses = strVal;
        } else if (lowerKey === 'bulk purchase available' || lowerKey === 'bulk purchase enabled' || lowerKey === 'bulkpurchaseenabled') {
          normalizedRow.bulkPurchaseEnabled = strVal;
        } else if (lowerKey === 'minimum order quantity of bulk purchase' || lowerKey === 'minimum order quantity of bulk purchase ' || lowerKey === 'bulk purchase min order quantity' || lowerKey === 'bulkpurchaseminorderquantity') {
          normalizedRow.bulkPurchaseMinOrderQuantity = strVal;
        } else if (lowerKey === 'main category' || lowerKey === 'maincategory') {
          normalizedRow.mainCategory = strVal;
        } else if (lowerKey === 'sub-category' || lowerKey === 'subcategory') {
          normalizedRow.subCategory = strVal;
        } else if (lowerKey === 'product type' || lowerKey === 'producttype' || lowerKey === 'premium type' || lowerKey === 'premiumtype' || lowerKey === 'type') {
          normalizedRow.premiumType = strVal;
        } else if (lowerKey === 'color variant') {
          normalizedRow.colorVariant = strVal;
        } else if (lowerKey === 'size variant') {
          normalizedRow.sizeVariant = strVal;
        } else if (lowerKey === 'material/fabric variant') {
          normalizedRow.materialVariant = strVal;
        } else if (lowerKey === 'pattern/design variant') {
          normalizedRow.patternVariant = strVal;
        } else if (lowerKey === 'weight variant') {
          normalizedRow.weightVariant = strVal;
        } else if (lowerKey === 'weight of the product with packaging' || lowerKey === 'product weight' || lowerKey === 'productweight') {
          normalizedRow.productWeightWithPackaging = strVal;
        } else if (lowerKey === 'delivery type' || lowerKey === 'delivery by' || lowerKey === 'deliveryby') {
          normalizedRow.deliveryType = strVal;
        } else if (lowerKey === 'seo page title' || lowerKey === 'page title' || lowerKey === 'pagetitle') {
          normalizedRow.pageTitle = strVal;
        } else if (lowerKey === 'seo page description' || lowerKey === 'meta description' || lowerKey === 'metadescription') {
          normalizedRow.metaDescription = strVal;
        } else if (lowerKey === 'keywords (separated by comma)' || lowerKey === 'keywords' || lowerKey === 'tags') {
          normalizedRow.keywords = strVal;
        } else {
          normalizedRow[key] = strVal;
        }
      }

      if (normalizedRow.mainCategory) {
        normalizedRow.category = normalizedRow.mainCategory;
        if (normalizedRow.subCategory) {
          normalizedRow.category += " / " + normalizedRow.subCategory;
        }
      } else if (row.category) {
        normalizedRow.category = row.category;
      }

      return normalizedRow;
    };

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (rawRow) => {
        const row = mapCsvRow(rawRow);
        if (!row.title || !row.price || !row.category) return;
        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          try { fs.unlinkSync(req.file.path); } catch (_) {}
          return res.status(400).json({
            message: "No valid products found in CSV",
          });
        }

        try {
          await validateBulkProductCategories(req.user, rows);
        } catch (err) {
          try { fs.unlinkSync(req.file.path); } catch (_) {}
          if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
          throw err;
        }

        const products = [];
        const isPremium =
          req.user.sellerType === "premium" && req.user.subscriptionActive === true;

        for (const row of rows) {
          // Premium checks
          const wantsBulk =
            row.bulkPurchaseEnabled === "true" ||
            row.bulkPurchaseEnabled === true ||
            row.bulkPurchaseEnabled === "1" ||
            row.bulkPurchaseEnabled === 1 ||
            String(row.bulkPurchaseEnabled).trim().toLowerCase() === "yes";

          if (wantsBulk && !isPremium) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
            return sendPlanErrorResponse(res, createPremiumRequiredError(
              "You need to upgrade to Premium to enable Bulk Purchase / B2B.",
              "bulk_purchase"
            ));
          }

          let localImagePaths = [];
          let originalUrls = [];

          if (row.imageLinks) {
            originalUrls = row.imageLinks
              .split(",")
              .map((url) => url.trim())
              .filter((url) => url);
            
            // Limit processing to the first 5 images
            const urlsToProcess = originalUrls.slice(0, 5);

            for (const url of urlsToProcess) {
              try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error(`Failed to fetch: ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const inputBuffer = Buffer.from(arrayBuffer);

                const filename =
                  Date.now() + "-" + Math.round(Math.random() * 1e9) + ".jpg";
                ensureUploadsRoot();
                const productsDir = path.join(getUploadsRoot(), "products");
                if (!fs.existsSync(productsDir)) {
                  fs.mkdirSync(productsDir, { recursive: true });
                }
                const absPath = path.join(productsDir, filename);

                const processedBuffer = await optimizeImageBuffer(inputBuffer);
                fs.writeFileSync(absPath, processedBuffer);

                let savedPath = absoluteToWebPath(absPath);
                if (isGoogleDriveConfigured()) {
                  const uploadResult = await uploadFileToDrive(absPath, "image/jpeg", filename);
                  if (uploadResult) {
                    savedPath = uploadResult.url;
                  }
                }
                localImagePaths.push(savedPath);
              } catch (err) {
                console.error(
                  "Failed to process image from URL:",
                  url,
                  err.message
                );
              }
            }
          }

          let rowCategory = row.category;
          try {
            const resolved = await resolveSellerCategory(req.user, row.category, {
              premiumType: row.premiumType || "",
            });
            rowCategory = resolved.category;
          } catch (err) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
            if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
            throw err;
          }

          let minOrderQty = 1;
          if (row.minOrderQuantity !== undefined && row.minOrderQuantity !== "") {
            const val = Number(row.minOrderQuantity);
            if (Number.isFinite(val) && val >= 1) {
              minOrderQty = Math.floor(val);
            }
          }

          let maxOrderQty = 5;
          if (row.maxOrderQuantity !== undefined && row.maxOrderQuantity !== "") {
            const val = Number(row.maxOrderQuantity);
            if (Number.isFinite(val) && val >= 1) {
              maxOrderQty = Math.floor(val);
            }
          }

          let bulkMinQty = 50;
          if (row.bulkPurchaseMinOrderQuantity !== undefined && row.bulkPurchaseMinOrderQuantity !== "") {
            const val = Number(row.bulkPurchaseMinOrderQuantity);
            if (Number.isFinite(val) && val >= 1) {
              bulkMinQty = Math.floor(val);
            }
          }

          let dispatchDays = undefined;
          if (row.dispatchDeliveryDays !== undefined && row.dispatchDeliveryDays !== "") {
            const val = Number(row.dispatchDeliveryDays);
            if (Number.isFinite(val) && val >= 0) {
              dispatchDays = Math.floor(val);
            }
          }

          let isPhysical = true;
          if (row.isPhysicalProduct !== undefined && row.isPhysicalProduct !== "") {
            isPhysical =
              row.isPhysicalProduct === "true" ||
              row.isPhysicalProduct === true ||
              row.isPhysicalProduct === "1" ||
              row.isPhysicalProduct === 1 ||
              String(row.isPhysicalProduct).trim().toLowerCase() === "yes";
          }

          let weight = 0;
          let weightUnit = "g";
          const rawWeight = row.productWeightWithPackaging;
          if (rawWeight !== undefined && rawWeight !== null && String(rawWeight).trim() !== "") {
            const match = String(rawWeight).trim().match(/^([\d.]+)\s*([a-zA-Z]*)$/);
            if (match) {
              const val = Number(match[1]);
              if (Number.isFinite(val) && val >= 0) {
                weight = val;
              }
              const unit = match[2].toLowerCase();
              if (["g", "kg", "lb", "oz"].includes(unit)) {
                weightUnit = unit;
              }
            } else {
              const val = Number(rawWeight);
              if (Number.isFinite(val) && val >= 0) {
                weight = val;
              }
            }
          }

          let pkgLength = undefined;
          let pkgWidth = undefined;
          let pkgHeight = undefined;
          let pkgDimensionsUnit = "cm";

          let purType = "one_time";
          if (row.purchaseType !== undefined && row.purchaseType !== "") {
            const val = String(row.purchaseType).trim().toLowerCase();
            if (val.includes("one_time") || val.includes("one-time")) {
              purType = "one_time";
            } else if (val.includes("subscription")) {
              purType = "subscription";
            } else if (val.includes("custom")) {
              purType = "custom_order";
            } else if (["one_time", "subscription", "custom_order"].includes(val)) {
              purType = val;
            }
          }

          if ((purType === "subscription" || purType === "custom_order") && !isPremium) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
            return sendPlanErrorResponse(res, createPremiumRequiredError(
              `${purType === "subscription" ? "Subscription" : "Custom Order"} purchase type is only available for subscribed sellers. Upgrade to premium to use this option.`,
              "premium"
            ));
          }

          let delBy = "all_india";
          let delValues = [];

          if (row.deliveryType) {
            const typeStr = String(row.deliveryType).trim().toLowerCase();
            if (typeStr.includes("all_india") || typeStr.includes("all india") || typeStr.includes("india")) {
              delBy = "all_india";
            } else if (typeStr.includes("state")) {
              delBy = "state";
              const parts = typeStr.split(/[:\-]/);
              if (parts.length > 1) {
                delValues = parts[1].split(",").map(v => v.trim()).filter(Boolean);
              }
            } else if (typeStr.includes("city")) {
              delBy = "city";
              const parts = typeStr.split(/[:\-]/);
              if (parts.length > 1) {
                delValues = parts[1].split(",").map(v => v.trim()).filter(Boolean);
              }
            } else if (typeStr.includes("pincode")) {
              delBy = "pincode";
              const parts = typeStr.split(/[:\-]/);
              if (parts.length > 1) {
                delValues = parts[1].split(",").map(v => v.trim()).filter(Boolean);
              }
            } else {
              const vals = typeStr.split(",").map(v => v.trim()).filter(Boolean);
              if (vals.length > 0) {
                const isPincode = vals.every(v => /^\d+$/.test(v));
                if (isPincode) {
                  delBy = "pincode";
                  delValues = vals;
                } else {
                  delBy = "state";
                  delValues = vals;
                }
              }
            }
          }

          const sellerAddresses = (req.user.storeAddresses || [])
            .map((a) => String(a).trim())
            .filter(Boolean);

          let storeAddrs = [];
          if (row.shipFromStoreAddresses) {
            storeAddrs = row.shipFromStoreAddresses.split(",").map(v => v.trim()).filter(Boolean);
          }
          if (storeAddrs.length === 0 && sellerAddresses.length > 0) {
            storeAddrs = [sellerAddresses[0]];
          }

          for (const addr of storeAddrs) {
            if (!sellerAddresses.includes(addr)) {
              try { fs.unlinkSync(req.file.path); } catch (_) {}
              return res.status(400).json({
                message: `Store address "${addr}" in CSV is not registered on your seller profile. Please add it in KYC first.`,
              });
            }
          }

          if (storeAddrs.length > 1 && !isPremium) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
            return res.status(400).json({
              message: "Only one store address allowed for free users. Subscribe to Premium to select multiple addresses.",
            });
          }

          const parseBool = (val) => {
            if (!val) return false;
            const s = String(val).trim().toLowerCase();
            return s === "true" || s === "yes" || s === "1" || s === "y" || s === "enabled";
          };

          const policies = {
            return: {
              enabled: parseBool(row.returnEnabled),
              terms: row.returnTerms || "",
            },
            refund: {
              enabled: parseBool(row.refundEnabled),
              terms: row.refundTerms || "",
            },
            replacement: {
              enabled: parseBool(row.replacementEnabled),
              terms: row.replacementTerms || "",
            },
          };

          const variants = [];
          if (row.colorVariant) {
            row.colorVariant.split(",").map(v => v.trim()).filter(Boolean).forEach(val => {
              variants.push({ type: "color", value: val });
            });
          }
          if (row.sizeVariant) {
            row.sizeVariant.split(",").map(v => v.trim()).filter(Boolean).forEach(val => {
              variants.push({ type: "size", value: val });
            });
          }
          if (row.materialVariant) {
            row.materialVariant.split(",").map(v => v.trim()).filter(Boolean).forEach(val => {
              variants.push({ type: "material", value: val });
            });
          }
          if (row.patternVariant) {
            row.patternVariant.split(",").map(v => v.trim()).filter(Boolean).forEach(val => {
              variants.push({ type: "pattern", value: val });
            });
          }
          if (row.weightVariant) {
            row.weightVariant.split(",").map(v => v.trim()).filter(Boolean).forEach(val => {
              variants.push({ type: "weight", value: val });
            });
          }

          let keywordArray = [];
          if (row.keywords) {
            keywordArray = row.keywords.split(",").map(k => k.trim()).filter(Boolean);
          }

          products.push({
            sellerId: req.user._id,
            title: row.title,
            description: row.description || "",
            price: Number(row.price),
            compareAtPrice: row.compareAtPrice ? Number(row.compareAtPrice) : undefined,
            stock: Number(row.stock || 0),
            category: rowCategory,
            premiumType: row.premiumType || "",
            keywords: keywordArray,
            images: localImagePaths,
            csvOriginalImageLinks: originalUrls,
            sku: row.sku || "",
            barcode: row.barcode || "",
            minOrderQuantity: minOrderQty,
            maxOrderQuantity: maxOrderQty,
            bulkPurchaseEnabled: wantsBulk,
            bulkPurchaseMinOrderQuantity: bulkMinQty,
            dispatchDeliveryDays: dispatchDays,
            purchaseType: purType,
            isPhysicalProduct: isPhysical,
            productWeight: weight,
            productWeightUnit: weightUnit,
            packageLength: pkgLength,
            packageWidth: pkgWidth,
            packageHeight: pkgHeight,
            packageDimensionsUnit: pkgDimensionsUnit,
            deliveryBy: delBy,
            deliveryValues: delValues,
            shipFromStoreAddresses: storeAddrs,
            policies: policies,
            variants: variants,
            careInstructions: row.careInstructions || "",
            keyHighlights: row.keyHighlights || "",
            pageTitle: row.pageTitle || row.title.substring(0, 70),
            metaDescription: row.metaDescription || "",
            urlHandle: row.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)+/g, ""),
            isDraft: false,
            approvalStatus: "pending",
          });
        }

        await Product.insertMany(products);
        try { fs.unlinkSync(req.file.path); } catch (_) {}

        logBulkProductUpload(req.user._id, products.length);

        res.json({
          message: "Bulk upload successful",
          count: products.length,
          products: products, // Return the uploaded products for display
        });
      })
      .on("error", (err) => {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        res.status(500).json({
          message: "CSV processing failed",
          error: err.message,
        });
      });
  } catch (error) {
    try {
      if (req.file?.path) fs.unlinkSync(req.file.path);
    } catch (_) {}
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET PRODUCT BY ID (NEW)
// ===============================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: "sellerId",
      select:
        "firstName lastName businessName email mobile sellerType subscriptionActive subscriptionPlan bulkPurchaseEnabled",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (
      !product.isActive ||
      product.isDraft ||
      product.approvalStatus !== "approved"
    ) {
      return res.status(404).json({ message: "Product not available" });
    }

    if (req.subdomainStore) {
      const prodSellerId = product.sellerId._id?.toString() || product.sellerId.toString();
      const storeSellerId = req.subdomainStore.sellerId.toString();
      if (prodSellerId !== storeSellerId) {
        return res.status(404).json({ message: "Product not found on this store" });
      }
    }

    // Analytics: record a product/store view (best-effort; don't block the response)
    try {
      const ip =
        (req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.ip || "")
          .trim();
      const ua = String(req.headers["user-agent"] || "");
      const raw = `${ip}|${ua}`;
      const visitorHash = crypto.createHash("sha256").update(raw).digest("hex");

      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      const existing = await ProductViewEvent.findOne({
        productId: product._id,
        visitorHash,
        createdAt: { $gte: start, $lte: end },
      }).select("_id");

      if (!existing) {
        await ProductViewEvent.create({
          sellerId: product.sellerId?._id,
          productId: product._id,
          userId: req.user?._id || null,
          visitorHash,
        });
      }
    } catch (e) {
      // ignore
    }

    res.json(product);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE PRODUCT (SELLER ONLY)
// ===============================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    try {
      assertProductEditable(product);
    } catch (err) {
      return sendProductLockedResponse(res, err);
    }

    try {
      await applyCategoryPlanToBody(req, product);
    } catch (err) {
      if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
      throw err;
    }

    applyProductFields(product, req.body, {
      partial: false,
      seller: req.user,
    });

    const newImages = getUploadedImagePaths(req, "images") || [];
    const existingImages = parseExistingImagePaths(req.body.existingImages);
    if (req.body.existingImages !== undefined || newImages.length > 0) {
      const merged = [...existingImages, ...newImages].slice(0, MAX_PRODUCT_IMAGES);
      if (merged.length > MAX_PRODUCT_IMAGES) {
        return res.status(400).json({
          message: `Maximum ${MAX_PRODUCT_IMAGES} images allowed per product.`,
        });
      }
      product.images = merged;
    }

    const variantImagePaths = getUploadedFieldFilePaths(req, "variantImages");
    if (variantImagePaths.length > 0 && Array.isArray(product.variants)) {
      let idx = 0;
      product.variants = product.variants.map((v) => {
        if (idx >= variantImagePaths.length) return v;
        if (v && (!v.image || String(v.image).trim() === "")) {
          const next = { ...v, image: variantImagePaths[idx] };
          idx += 1;
          return next;
        }
        return v;
      });
    }

    if (product.approvalStatus === "rejected") {
      product.approvalStatus = "pending";
    }

    await product.save();
    logProductUpdated(req.user._id, product);
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    if (error.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, error);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// ===============================
// 🗑️ DELETE PRODUCT (SELLER ONLY)
// ===============================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    const title = product.title;
    const productId = product._id;
    await product.deleteOne();
    logProductDeleted(req.user._id, title, productId);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 👁️ UPDATE PRODUCT ACTIVE STATUS (SELLER ONLY)
// ===============================
export const updateProductActiveStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (isActive === undefined) {
      return res.status(400).json({ message: "isActive is required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this product status" });
    }

    product.isActive = Boolean(isActive);
    await product.save();

    res.json({
      message: `Product successfully ${product.isActive ? "made live" : "unlisted"}`,
      product,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📍 CHECK PINCODE SERVICEABILITY
// ===============================
export const checkPincode = async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode) {
      return res.status(400).json({ message: "Pincode is required" });
    }

    const product = await Product.findById(req.params.id).populate({
      path: "sellerId",
      select: "isHyperlocal deliverablePincodes",
    });

    if (!product || !product.sellerId) {
      return res.status(404).json({ message: "Product or seller not found" });
    }

    const seller = product.sellerId;

    if (!seller.isHyperlocal) {
      return res.json({
        serviceable: true,
        message: "Delivery available to this pincode.",
      });
    }

    let isDeliverable = seller.deliverablePincodes.includes(pincode.trim());

    if (product.deliveryBy === "pincode" && product.deliveryValues?.length > 0) {
      isDeliverable = product.deliveryValues.includes(pincode.trim());
    } else if (product.deliveryBy === "all_india") {
      isDeliverable = true;
    }

    if (isDeliverable) {
      return res.json({
        serviceable: true,
        message: "Delivery available to this pincode.",
      });
    }

    return res.json({
      serviceable: false,
      message: `Currently not delivering to ${pincode}.`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/shipping/suggestions?scope=city|state|all_india&q=
export const getDeliverySuggestions = async (req, res) => {
  try {
    const { scope, q = "" } = req.query;
    const query = String(q).trim();

    let sourceList = [];
    let displayLimit = 80;

    if (scope === "city") {
      sourceList = await getIndianCities();
      displayLimit = 100;
    } else if (scope === "state") {
      sourceList = await getIndianStates();
      displayLimit = 40;
    } else if (scope === "all_india") {
      sourceList = ALL_INDIA_REGIONS;
      displayLimit = 20;
    } else {
      return res.status(400).json({
        message: "scope must be city, state, or all_india",
      });
    }

    let suggestions = [];
    let totalMatches = 0;

    if (!query) {
      suggestions = sourceList.slice(0, displayLimit);
      totalMatches = sourceList.length;
    } else {
      const allMatches = filterSuggestionsStartsWith(sourceList, query);
      suggestions = filterSuggestionsStartsWithLimited(
        sourceList,
        query,
        displayLimit
      );
      totalMatches = allMatches.length;
    }

    res.json({
      suggestions,
      totalMatches,
      hasMore: totalMatches > suggestions.length,
      scope,
      query,
      matchMode: "startsWith",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/shipping/delivery-options
export const getDeliveryOptions = async (req, res) => {
  res.json({ options: DELIVERY_BY_OPTIONS });
};

// GET /api/products/bulk/template
export const downloadBulkUploadTemplate = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // 1. Create main sheet
    const productsSheet = workbook.addWorksheet("Products");
    
    // 2. Create metadata sheet
    const metadataSheet = workbook.addWorksheet("Metadata");
    metadataSheet.state = "hidden"; // Hide metadata sheet to keep it clean

    // 3. Populate Metadata
    const taxonomy = getCategoryTaxonomyForApi();
    
    // Main Categories in col A
    const mainCats = SELLER_MAIN_CATEGORIES;
    mainCats.forEach((val, idx) => {
      metadataSheet.getCell(`A${idx + 1}`).value = val;
    });

    // Unique Subcategories in col B
    const subCatsSet = new Set();
    Object.values(taxonomy.subcategoriesByMain || {}).forEach((list) => {
      list.forEach((sub) => subCatsSet.add(sub));
    });
    const subCats = Array.from(subCatsSet).filter(Boolean);
    subCats.forEach((val, idx) => {
      metadataSheet.getCell(`B${idx + 1}`).value = val;
    });

    // Unique Product Types in col C
    const pTypesSet = new Set();
    Object.values(taxonomy.typesByMainSub || {}).forEach((subMap) => {
      Object.values(subMap || {}).forEach((types) => {
        types.forEach((t) => pTypesSet.add(t));
      });
    });
    const pTypes = Array.from(pTypesSet).filter(Boolean);
    pTypes.forEach((val, idx) => {
      metadataSheet.getCell(`C${idx + 1}`).value = val;
    });

    // Store Addresses in col D
    const sellerAddresses = (req.user.storeAddresses || [])
      .map((a) => String(a).trim())
      .filter(Boolean);
    
    if (sellerAddresses.length === 0) {
      sellerAddresses.push("Main Shop Location"); // Fallback if no store address registered
    }
    sellerAddresses.forEach((val, idx) => {
      metadataSheet.getCell(`D${idx + 1}`).value = val;
    });

    // Yes/No in col E
    const yesNoOptions = ["Yes", "No"];
    yesNoOptions.forEach((val, idx) => {
      metadataSheet.getCell(`E${idx + 1}`).value = val;
    });

    // Purchase Types in col F
    const purchaseTypes = ["One-time purchase", "Subscription", "Custom Order"];
    purchaseTypes.forEach((val, idx) => {
      metadataSheet.getCell(`F${idx + 1}`).value = val;
    });

    // Delivery Types in col G
    const deliveryTypes = ["All India", "State", "City", "Pincode"];
    deliveryTypes.forEach((val, idx) => {
      metadataSheet.getCell(`G${idx + 1}`).value = val;
    });

    // 4. Setup headers in Products Sheet
    const headers = [
      "Product title", "Product Description", "Image link", "Return", "Terms of return", 
      "Refund", "Terms of refund", "Replacement", "Terms of replacement", "Care instructions ", 
      "Key highlight/USP", "Price", "Discounted Price", "SKU (Stock Keeping Unit)", 
      "Dispatch and delivery time", "Minimum Order Quantity", "Maximum order Quantity", 
      "Purchase Type", "Store Address", "Bulk Purchase Available", "Minimum Order Quantity of bulk purchase ", 
      "Main Category", "Sub-Category", "Product Type", "Color Variant", "Size Variant", 
      "Material/Fabric Variant", "Pattern/Design Variant", "Weight Variant", 
      "Weight of the product with packaging", "Delivery Type", "SEO Page title", 
      "SEO Page Description", "Keywords (Separated by comma)"
    ];

    productsSheet.addRow(headers);

    // Style the header row
    const headerRow = productsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4F46E5" } // Sleek Indigo color
    };
    headerRow.height = 25;
    headerRow.commit();

    // Auto-fit columns roughly
    headers.forEach((h, idx) => {
      const col = productsSheet.getColumn(idx + 1);
      col.width = Math.max(h.length + 5, 15);
    });

    // Add empty rows for data validation (apply to rows 2 to 200)
    for (let r = 2; r <= 200; r++) {
      // Return validation (Col D -> Yes/No)
      productsSheet.getCell(`D${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select Yes or No from the list."
      };

      // Refund validation (Col F -> Yes/No)
      productsSheet.getCell(`F${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select Yes or No from the list."
      };

      // Replacement validation (Col H -> Yes/No)
      productsSheet.getCell(`H${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select Yes or No from the list."
      };

      // Purchase Type validation (Col R)
      productsSheet.getCell(`R${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"One-time purchase,Subscription,Custom Order"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select a purchase type from the list."
      };

      // Store Address validation (Col S)
      productsSheet.getCell(`S${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`=Metadata!$D$1:$D$${sellerAddresses.length}`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select one of your registered store addresses."
      };

      // Bulk Purchase Available validation (Col T -> Yes/No)
      productsSheet.getCell(`T${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"Yes,No"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select Yes or No."
      };

      // Main Category validation (Col V)
      productsSheet.getCell(`V${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`=Metadata!$A$1:$A$${mainCats.length}`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select a valid Main Category from the list."
      };

      // Sub-Category validation (Col W)
      productsSheet.getCell(`W${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`=Metadata!$B$1:$B$${subCats.length}`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select a valid Sub-Category."
      };

      // Product Type validation (Col X)
      productsSheet.getCell(`X${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`=Metadata!$C$1:$C$${pTypes.length}`],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select a valid Product Type."
      };

      // Delivery Type validation (Col AE)
      productsSheet.getCell(`AE${r}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"All India,State,City,Pincode"'],
        showErrorMessage: true,
        errorTitle: "Invalid Value",
        error: "Please select a delivery scope option."
      };
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bulk_upload_template.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: "Failed to generate Excel template", error: error.message });
  }
};
