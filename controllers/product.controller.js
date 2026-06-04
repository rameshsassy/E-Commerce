import Product from "../models/Product.js";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import crypto from "crypto";
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
import { PLAN_ERROR_CODE } from "../utils/storePlanLimits.js";
import {
  logProductCreated,
  logProductUpdated,
  logProductDeleted,
  logBulkProductUpload,
} from "../services/sellerActivity.service.js";

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
// 📦 GET ALL PRODUCTS (FULL FIX)
// ===============================
export const getAllProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
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

    const resolvedCategory = resolveCategoryParams({
      main,
      sub,
      type,
      category,
    });

    let query = {
      sellerId: { $ne: null },
      isActive: true,
      isDraft: { $ne: true },
      approvalStatus: "approved",
    };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { keywords: { $regex: keyword, $options: "i" } },
      ];
    }

    const categoryFilter = buildCategoryProductFilter({
      main: resolvedCategory.main,
      sub: resolvedCategory.sub,
      type: resolvedCategory.type,
      legacyCategory: category,
    });
    if (categoryFilter && Object.keys(categoryFilter).length > 0) {
      Object.assign(query, categoryFilter);
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (seller) {
      query.sellerId = seller;
    }

    const { page: pageNumber, limit: limitNumber, skip } = resolveListPagination(
      req,
      { page: pageQuery, limit: limitQuery },
      { defaults: { mobile: 12, tablet: 16, desktop: 20 } }
    );

    let sortObj = { createdAt: -1 };
    if (sort === "price-low") sortObj = { price: 1 };
    if (sort === "price-high") sortObj = { price: -1 };
    if (sort === "newest") sortObj = { createdAt: -1 };

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
        if (lowerKey === 'title' || lowerKey === 'product name' || lowerKey === 'name') {
          normalizedRow.title = value;
        } else if (lowerKey === 'price' || lowerKey === 'cost' || lowerKey === 'mrp') {
          normalizedRow.price = value;
        } else if (lowerKey === 'description' || lowerKey === 'product description') {
          normalizedRow.description = value;
        } else if (lowerKey === 'category' || lowerKey === 'product category') {
          normalizedRow.category = value;
        } else if (lowerKey === 'stock' || lowerKey === 'quantity') {
          normalizedRow.stock = value;
        } else if (lowerKey === 'keywords' || lowerKey === 'tags') {
          normalizedRow.keywords = value;
        } else if (lowerKey === 'discounted' || lowerKey === 'compare at price') {
          normalizedRow.compareAtPrice = value;
        } else if (lowerKey === 'imagelinks' || lowerKey === 'image links' || lowerKey === 'images') {
          normalizedRow.imageLinks = value;
        } else {
          normalizedRow[key] = value;
        }
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
          return res.status(400).json({
            message: "No valid products found in CSV",
          });
        }

        try {
          await validateBulkProductCategories(req.user, rows);
        } catch (err) {
          if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
          throw err;
        }

        const products = [];

        for (const row of rows) {
          let localImagePaths = [];

          if (row.imageLinks) {
            const urls = row.imageLinks
              .split(",")
              .map((url) => url.trim())
              .filter((url) => url);
            for (const url of urls) {
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
                localImagePaths.push(absoluteToWebPath(absPath));
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
            const resolved = await resolveSellerCategory(req.user, row.category, {});
            rowCategory = resolved.category;
          } catch (err) {
            if (err.code === PLAN_ERROR_CODE) return sendPlanErrorResponse(res, err);
            throw err;
          }

          products.push({
            sellerId: req.user._id,
            title: row.title,
            description: row.description || "",
            price: Number(row.price),
            stock: Number(row.stock || 0),
            category: rowCategory,
            keywords: row.keywords ? row.keywords.split(",") : [],
            images: localImagePaths,
            isDraft: false,
            approvalStatus: "pending",
          });
        }

        await Product.insertMany(products);
        fs.unlinkSync(req.file.path);

        logBulkProductUpload(req.user._id, products.length);

        res.json({
          message: "Bulk upload successful",
          count: products.length,
          products: products, // Return the uploaded products for display
        });
      })
      .on("error", (err) => {
        res.status(500).json({
          message: "CSV processing failed",
          error: err.message,
        });
      });
  } catch (error) {
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
        "firstName lastName businessName email mobile sellerType subscriptionActive bulkPurchaseEnabled",
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
