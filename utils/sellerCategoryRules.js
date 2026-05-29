import Product from "../models/Product.js";
import { isSubscribedSeller } from "./productInventoryRules.js";
import { createPremiumRequiredError } from "./storePlanLimits.js";
import { SELLER_MAIN_CATEGORIES } from "../data/sellerMainCategories.js";

export function parseMainCategory(categoryValue) {
  const raw = String(categoryValue || "").trim();
  if (!raw || raw === "Uncategorized") return "";
  const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
  return parts[0] || "";
}

export function parseSubCategory(categoryValue) {
  const raw = String(categoryValue || "").trim();
  if (!raw) return "";
  const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
  return parts[1] || "";
}

export function getCategoryPlanLimits(seller) {
  const subscribed = isSubscribedSeller(seller);
  return {
    isSubscribedSeller: subscribed,
    allowMultipleCategories: subscribed,
    allowSubcategories: subscribed,
    mainCategoryOptions: SELLER_MAIN_CATEGORIES,
    categoryHint: subscribed
      ? "Choose main, sub-category, and product type."
      : "Free plan: one main category for your entire catalog. Upgrade for multiple categories and sub-categories.",
  };
}

export async function getSellerDistinctMainCategories(sellerId, excludeProductId = null) {
  const filter = {
    sellerId,
    category: { $exists: true, $nin: ["", "Uncategorized", null] },
  };
  if (excludeProductId) {
    filter._id = { $ne: excludeProductId };
  }
  const categories = await Product.distinct("category", filter);
  const mains = [
    ...new Set(
      categories.map(parseMainCategory).filter((m) => m && m !== "Uncategorized")
    ),
  ];
  return mains;
}

/**
 * Validate and normalize category for seller plan. Throws PREMIUM_REQUIRED when needed.
 */
export async function resolveSellerCategory(
  seller,
  categoryInput,
  { excludeProductId = null, premiumType } = {}
) {
  const subscribed = isSubscribedSeller(seller);
  const raw = String(categoryInput ?? "").trim();

  if (subscribed) {
    const category =
      raw !== "" ? raw : "Uncategorized";
    return {
      category,
      premiumType:
        premiumType !== undefined ? String(premiumType || "").trim() : undefined,
    };
  }

  if (premiumType !== undefined && String(premiumType || "").trim()) {
    throw createPremiumRequiredError(
      "Product types and sub-categories require Premium. Upgrade to use advanced category options.",
      "multiple_categories"
    );
  }

  const sub = parseSubCategory(raw);
  if (sub) {
    throw createPremiumRequiredError(
      "Sub-categories require Premium. Free plan includes one main category only.",
      "multiple_categories"
    );
  }

  const main = parseMainCategory(raw) || (raw && !raw.includes("/") ? raw : "");
  const distinct = await getSellerDistinctMainCategories(
    seller._id,
    excludeProductId
  );

  if (distinct.length > 0) {
    const locked = distinct[0];
    if (main && main !== locked) {
      throw createPremiumRequiredError(
        `Your free plan is limited to the "${locked}" category. Upgrade to Premium to sell in multiple categories.`,
        "multiple_categories"
      );
    }
    return { category: locked, premiumType: "" };
  }

  if (!main) {
    return { category: "Uncategorized", premiumType: "" };
  }

  if (!SELLER_MAIN_CATEGORIES.includes(main)) {
    return { category: main, premiumType: "" };
  }

  return { category: main, premiumType: "" };
}

export async function validateBulkProductCategories(seller, rows) {
  if (isSubscribedSeller(seller)) return;
  const distinct = await getSellerDistinctMainCategories(seller._id);
  const mains = new Set(distinct);
  for (const row of rows) {
    const sub = parseSubCategory(row.category);
    if (sub) {
      throw createPremiumRequiredError(
        "Sub-categories in CSV require Premium. Use one main category per product on the free plan.",
        "multiple_categories"
      );
    }
    const main = parseMainCategory(row.category);
    if (main) mains.add(main);
  }
  if (mains.size > 1) {
    throw createPremiumRequiredError(
      "Bulk upload includes multiple categories. Free plan allows one main category — upgrade to Premium or use a single category in your CSV.",
      "multiple_categories"
    );
  }
}

export async function getSellerCategoryLimitsForApi(seller) {
  const plan = getCategoryPlanLimits(seller);
  const usedMainCategories = await getSellerDistinctMainCategories(seller._id);
  const lockedMainCategory =
    !plan.allowMultipleCategories && usedMainCategories.length === 1
      ? usedMainCategories[0]
      : null;

  return {
    ...plan,
    usedMainCategories,
    lockedMainCategory,
  };
}
