import sanitizeHtml from "sanitize-html";
import { absoluteToWebPath } from "./uploadPaths.js";
import {
  validateProductDescription,
  validateProductTitle,
  htmlToPlainText,
} from "./productContentValidation.js";
import { applyPoliciesAndCare } from "./productPolicyCare.js";
import {
  validateOrderQuantityFields,
  applyOrderQuantityFields,
} from "./productOrderQuantity.js";
import {
  applyInventoryFields,
  validateInventoryFields,
} from "./productInventoryRules.js";
import {
  applyDeliveryFields,
  validateDeliveryFields,
} from "./deliveryFields.js";
import { isSubscribedSeller } from "./productInventoryRules.js";
import { createPremiumRequiredError } from "./storePlanLimits.js";

export { validateInventoryFields, applyInventoryFields };

export const sanitizeDescription = (html) => {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "b",
      "i",
      "strong",
      "em",
      "u",
      "p",
      "div",
      "br",
      "span",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "font",
    ],
    allowedAttributes: {
      "*": ["style", "class", "align"],
      font: ["size", "face", "color"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^left$/, /^right$/, /^center$/, /^justify$/],
        color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^rgba\(/i],
        "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i, /^rgba\(/i],
        "font-size": [/^\d+(?:px|pt|em|%)$/],
      },
    },
  });
};

export function parseKeywords(keywords) {
  if (typeof keywords === "string" && keywords.trim() !== "") {
    const list = keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (list.length > 5) {
      const err = new Error("A maximum of 5 SEO keywords are allowed.");
      err.statusCode = 400;
      throw err;
    }
    return list;
  }
  if (Array.isArray(keywords)) {
    const list = keywords.map((k) => String(k || "").trim()).filter(Boolean);
    if (list.length > 5) {
      const err = new Error("A maximum of 5 SEO keywords are allowed.");
      err.statusCode = 400;
      throw err;
    }
    return list;
  }
  return null;
}

export function parseLocations(locations, stockFallback) {
  let parsedLocations = [];
  if (locations !== undefined && locations !== null && locations !== "") {
    try {
      parsedLocations =
        typeof locations === "string" ? JSON.parse(locations) : locations;
    } catch {
      if (Array.isArray(locations)) parsedLocations = locations;
    }
  }

  if (parsedLocations.length > 0) {
    parsedLocations = parsedLocations
      .filter((loc) => loc.address && loc.address.trim() !== "")
      .map((loc) => ({
        address: loc.address,
        stock: Number(loc.stock) || 0,
      }));
    const totalStock = parsedLocations.reduce((sum, loc) => sum + loc.stock, 0);
    return { locations: parsedLocations, stock: totalStock };
  }

  const totalStock = Number(stockFallback) || 0;
  return {
    locations: [{ address: "Main Shop Location", stock: totalStock }],
    stock: totalStock,
  };
}

export function getUploadedImagePaths(req, key = "images") {
  if (!req.files) return null;

  // multer upload.array(...) => req.files is an array
  if (Array.isArray(req.files)) {
    if (req.files.length === 0) return null;
    return req.files.map((file) => absoluteToWebPath(file.path));
  }

  // multer upload.fields(...) => req.files is an object of arrays
  const list = req.files?.[key];
  if (!Array.isArray(list) || list.length === 0) return null;
  return list.map((file) => absoluteToWebPath(file.path));
}

export function getUploadedFieldFilePaths(req, key) {
  if (!req.files || Array.isArray(req.files)) return [];
  const list = req.files?.[key];
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map((file) => absoluteToWebPath(file.path));
}

export function parseVariants(input) {
  if (input === undefined || input === null || input === "") return null;
  let raw = input;
  if (typeof input === "string") {
    try {
      raw = JSON.parse(input);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(raw)) return null;
  return raw
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const type = String(v.type || "").trim();
      const value = String(v.value || "").trim();
      if (!type || !value) return null;
      const colorHexRaw =
        v.colorHex === undefined || v.colorHex === null ? "" : String(v.colorHex).trim();
      const colorHex =
        /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(colorHexRaw) ? colorHexRaw.toUpperCase() : "";
      return {
        type,
        value,
        ...(type === "color" && colorHex ? { colorHex } : {}),
        price: v.price === "" || v.price === undefined ? undefined : Number(v.price),
        compareAtPrice:
          v.compareAtPrice === "" || v.compareAtPrice === undefined
            ? undefined
            : Number(v.compareAtPrice),
        sku: v.sku ? String(v.sku) : "",
        dispatchDeliveryDays:
          v.dispatchDeliveryDays === "" || v.dispatchDeliveryDays === undefined
            ? undefined
            : Number(v.dispatchDeliveryDays),
        image: v.image ? String(v.image) : "",
      };
    })
    .filter(Boolean);
}

export function parseExistingImagePaths(input) {
  if (input === undefined || input === null || input === "") return [];
  if (Array.isArray(input)) return input.filter(Boolean).slice(0, 5);
  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed.filter(Boolean).slice(0, 5) : [];
  } catch {
    return [];
  }
}

/**
 * Apply request body fields onto a product document (partial updates allowed).
 */
export function applyProductFields(
  product,
  body,
  { partial = false, seller = null, requireStoreAddress = false } = {}
) {
  const {
    title,
    description,
    price,
    compareAtPrice,
    unitPrice,
    chargeTax,
    stock,
    locations,
    category,
    keywords,
    inventoryTracked,
    sku,
    barcode,
    continueSellingWhenOutOfStock,
    isPhysicalProduct,
    packageType,
    packageLength,
    packageWidth,
    packageHeight,
    packageDimensionsUnit,
    productWeight,
    productWeightUnit,
    deliveryBy,
    deliveryValues,
    pageTitle,
    metaDescription,
    urlHandle,
    bulkPurchaseEnabled,
    bulkPurchaseMinOrderQuantity,
    premiumType,
  } = body;

  if (title !== undefined && title !== "") {
    product.title = validateProductTitle(title);
  }
  if (description !== undefined) {
    const raw = String(description ?? "");
    if (partial) {
      // Autosave should never hard-fail while seller is still typing.
      // If the description is empty (or only editor placeholders), keep existing value.
      const plain = htmlToPlainText(raw);
      if (!plain) {
        // skip
      } else {
        try {
          product.description = sanitizeDescription(validateProductDescription(raw));
        } catch {
          // Skip invalid description during autosave; final submit will validate.
        }
      }
    } else {
      product.description = sanitizeDescription(
        validateProductDescription(raw)
      );
    }
  }
  if (price !== undefined && price !== "") product.price = Number(price);
  if (compareAtPrice !== undefined) {
    product.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : undefined;
  }
  if (unitPrice !== undefined) {
    product.unitPrice = unitPrice ? Number(unitPrice) : undefined;
  }
  if (chargeTax !== undefined) {
    product.chargeTax = chargeTax === "true" || chargeTax === true;
  }

  if (locations !== undefined) {
    const { locations: locs, stock: totalStock } = parseLocations(
      locations,
      stock ?? product.stock
    );
    product.locations = locs;
    product.stock = totalStock;
  } else if (stock !== undefined) {
    product.stock = Number(stock);
  }

  if (inventoryTracked !== undefined) {
    product.inventoryTracked =
      inventoryTracked === "true" || inventoryTracked === true;
  }
  if (sku !== undefined) product.sku = sku;

  if (seller) {
    const inventoryValues = validateInventoryFields(seller, body, {
      partial,
      requireStoreAddress,
    });
    applyInventoryFields(product, inventoryValues);

    const orderQty = validateOrderQuantityFields(body, seller, { partial });
    applyOrderQuantityFields(product, orderQty);
  }

  // Premium-only bulk purchase / B2B
  const subscribedSeller =
    seller?.sellerType === "premium" && seller?.subscriptionActive === true;

  const wantsBulk =
    bulkPurchaseEnabled === true ||
    bulkPurchaseEnabled === "true" ||
    bulkPurchaseEnabled === 1 ||
    bulkPurchaseEnabled === "1";

  const disablesBulk =
    bulkPurchaseEnabled === false ||
    bulkPurchaseEnabled === "false" ||
    bulkPurchaseEnabled === 0 ||
    bulkPurchaseEnabled === "0";

  if (bulkPurchaseEnabled !== undefined) {
    if (wantsBulk && !subscribedSeller) {
      throw createPremiumRequiredError(
        "You need to upgrade to Premium to enable Bulk Purchase / B2B.",
        "bulk_purchase"
      );
    }
    if (disablesBulk) product.bulkPurchaseEnabled = false;
    if (wantsBulk) product.bulkPurchaseEnabled = true;
  }

  const shouldValidateBulkMin =
    product.bulkPurchaseEnabled === true ||
    bulkPurchaseMinOrderQuantity !== undefined;

  if (shouldValidateBulkMin) {
    if (product.bulkPurchaseEnabled && !subscribedSeller) {
      throw createPremiumRequiredError(
        "You need to upgrade to Premium to enable Bulk Purchase / B2B.",
        "bulk_purchase"
      );
    }
    if (bulkPurchaseMinOrderQuantity !== undefined && bulkPurchaseMinOrderQuantity !== "") {
      const n = Number(bulkPurchaseMinOrderQuantity);
      if (!Number.isFinite(n) || n < 1) {
        const err = new Error("Bulk Purchase minimum order quantity must be at least 1.");
        err.statusCode = 400;
        throw err;
      }
      product.bulkPurchaseMinOrderQuantity = Math.floor(n);
    } else if (!partial && product.bulkPurchaseEnabled) {
      // keep schema default (50) unless explicitly set
      if (
        product.bulkPurchaseMinOrderQuantity === undefined ||
        product.bulkPurchaseMinOrderQuantity === null
      ) {
        product.bulkPurchaseMinOrderQuantity = 50;
      }
    }
  }

  if (barcode !== undefined) product.barcode = barcode;
  if (continueSellingWhenOutOfStock !== undefined) {
    product.continueSellingWhenOutOfStock =
      continueSellingWhenOutOfStock === "true" ||
      continueSellingWhenOutOfStock === true;
  }
  if (isPhysicalProduct !== undefined) {
    product.isPhysicalProduct =
      isPhysicalProduct === "true" || isPhysicalProduct === true;
  }
  if (packageType !== undefined) product.packageType = packageType;
  if (packageLength !== undefined) {
    product.packageLength = packageLength ? Number(packageLength) : undefined;
  }
  if (packageWidth !== undefined) {
    product.packageWidth = packageWidth ? Number(packageWidth) : undefined;
  }
  if (packageHeight !== undefined) {
    product.packageHeight = packageHeight ? Number(packageHeight) : undefined;
  }
  if (packageDimensionsUnit !== undefined) {
    product.packageDimensionsUnit = packageDimensionsUnit;
  }
  if (productWeight !== undefined) product.productWeight = Number(productWeight);
  if (productWeightUnit !== undefined) product.productWeightUnit = productWeightUnit;

  const delivery = validateDeliveryFields(
    {
      ...body,
      isPhysicalProduct:
        body.isPhysicalProduct !== undefined
          ? body.isPhysicalProduct
          : product.isPhysicalProduct,
    },
    {
      partial,
      requireIfPhysical: !partial && product.isPhysicalProduct !== false,
      existing: {
        deliveryBy: product.deliveryBy,
        deliveryValues: product.deliveryValues,
      },
    }
  );
  if (delivery.deliveryBy !== undefined) {
    applyDeliveryFields(product, delivery);
  }

  if (pageTitle !== undefined) product.pageTitle = pageTitle;
  if (metaDescription !== undefined) product.metaDescription = metaDescription;
  if (urlHandle !== undefined) product.urlHandle = urlHandle;

  const parsedVariants = parseVariants(body.variants);
  if (parsedVariants !== null) {
    product.variants = parsedVariants;
  }

  if (category !== undefined) {
    product.category =
      String(category).trim() !== "" ? String(category).trim() : "Uncategorized";
  }

  if (premiumType !== undefined) {
    product.premiumType = String(premiumType || "").trim();
  }

  if (
    body.policies !== undefined ||
    body.careInstructions !== undefined ||
    body.keyHighlights !== undefined
  ) {
    applyPoliciesAndCare(product, body, { sanitizeDescription });
  }

  if (body.dispatchDeliveryDays !== undefined && body.dispatchDeliveryDays !== "") {
    const days = Number(body.dispatchDeliveryDays);
    product.dispatchDeliveryDays = Number.isFinite(days) && days >= 0 ? days : undefined;
  } else if (body.dispatchDeliveryDays === "" || body.dispatchDeliveryDays === null) {
    product.dispatchDeliveryDays = undefined;
  }

  const parsedKeywords = parseKeywords(keywords);
  if (parsedKeywords !== null) product.keywords = parsedKeywords;

  if (!partial && product.title && !product.pageTitle) {
    product.pageTitle = product.title.substring(0, 70);
  }
  if (!partial && product.title && !product.urlHandle) {
    product.urlHandle = product.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  return product;
}
