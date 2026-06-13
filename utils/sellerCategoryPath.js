import Product from "../models/Product.js";
import { isOtherCategoryLabel } from "../data/sellerCategoryTaxonomy.js";

export const FREE_PLAN_CATEGORY_PATH_MESSAGE =
  "You are on the Free Plan. You can add products only under your selected category. Upgrade to Pro or Premium to add products in multiple categories.";

export function normalizeCategoryPath(categoryValue, premiumType = "") {
  const raw = String(categoryValue || "").trim();
  const parts = raw
    ? raw.split("/").map((p) => p.trim()).filter(Boolean)
    : [];
  const main = parts[0] || "";
  const sub = parts[1] || "";
  const type = String(premiumType || "").trim();
  return {
    main: main.toLowerCase(),
    sub: sub.toLowerCase(),
    type: type.toLowerCase(),
    mainDisplay: parts[0] || "",
    subDisplay: parts[1] || "",
    typeDisplay: String(premiumType || "").trim(),
  };
}

export function isCompleteCategoryPath(path) {
  if (!path?.main || !path?.sub || !path?.type) return false;
  if (
    isOtherCategoryLabel(path.mainDisplay) ||
    isOtherCategoryLabel(path.subDisplay) ||
    isOtherCategoryLabel(path.typeDisplay)
  ) {
    return false;
  }
  return true;
}

export function categoryPathKey(path) {
  if (!path) return "";
  return `${path.main}::${path.sub}::${path.type}`;
}

export function categoryPathsEqual(a, b) {
  if (!a || !b) return false;
  return (
    a.main === b.main &&
    a.sub === b.sub &&
    a.type === b.type
  );
}

export function formatCategoryPathLabel(path) {
  if (!path) return "";
  const main = path.mainDisplay || path.main;
  const sub = path.subDisplay || path.sub;
  const type = path.typeDisplay || path.type;
  if (!main) return "";
  if (!sub) return main;
  if (!type) return `${main} → ${sub}`;
  return `${main} → ${sub} → ${type}`;
}

export function buildCategoryFieldsFromPath(path) {
  const main = path.mainDisplay || path.main;
  const sub = path.subDisplay || path.sub;
  const category = sub ? `${main} / ${sub}` : main;
  return {
    category,
    premiumType: path.typeDisplay || path.type,
  };
}

/**
 * Locked path from existing catalog (non-draft products), excluding one product when editing.
 */
export async function getSellerLockedCategoryPath(sellerId, excludeProductId = null) {
  const filter = {
    sellerId,
    isDraft: { $ne: true },
    category: { $exists: true, $nin: ["", "Uncategorized", null] },
    premiumType: { $exists: true, $nin: ["", null] },
  };

  const products = await Product.find(filter)
    .select("category premiumType")
    .lean();

  const paths = [];
  for (const p of products) {
    if (excludeProductId && String(p._id) === String(excludeProductId)) {
      continue;
    }
    const path = normalizeCategoryPath(p.category, p.premiumType);
    if (isCompleteCategoryPath(path)) {
      paths.push(path);
    }
  }

  if (paths.length > 0) {
    const firstKey = categoryPathKey(paths[0]);
    const allSame = paths.every((p) => categoryPathKey(p) === firstKey);
    return allSame ? paths[0] : paths[0];
  }

  if (excludeProductId) {
    const current = await Product.findById(excludeProductId)
      .select("category premiumType")
      .lean();
    if (current) {
      const path = normalizeCategoryPath(current.category, current.premiumType);
      if (isCompleteCategoryPath(path)) return path;
    }
  }

  return null;
}

export function serializeLockedCategoryPathForApi(path) {
  if (!path) return null;
  return {
    main: path.mainDisplay || path.main,
    sub: path.subDisplay || path.sub,
    type: path.typeDisplay || path.type,
    label: formatCategoryPathLabel(path),
  };
}
