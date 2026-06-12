import { isSubscribedSeller } from "./productInventoryRules.js";
import Category from "../models/Category.js";
import { createPremiumRequiredError } from "./storePlanLimits.js";
import { SELLER_MAIN_CATEGORIES } from "../data/sellerMainCategories.js";
import {
  normalizeCategoryPath,
  isCompleteCategoryPath,
  categoryPathsEqual,
  buildCategoryFieldsFromPath,
  getSellerLockedCategoryPath,
  serializeLockedCategoryPathForApi,
  FREE_PLAN_CATEGORY_PATH_MESSAGE,
} from "./sellerCategoryPath.js";
import {
  assertCategoryPathResolved,
  getCategoryTaxonomyForApi,
} from "../data/sellerCategoryTaxonomy.js";

export function parseMainCategory(categoryValue) {
  return normalizeCategoryPath(categoryValue).mainDisplay || "";
}

export function parseSubCategory(categoryValue) {
  return normalizeCategoryPath(categoryValue).subDisplay || "";
}

export function createFreePlanCategoryPathError(message = FREE_PLAN_CATEGORY_PATH_MESSAGE) {
  const err = createPremiumRequiredError(message, "free_category_path");
  err.autoRedirect = true;
  return err;
}

export function getCategoryPlanLimits(seller) {
  const subscribed = isSubscribedSeller(seller);
  return {
    isSubscribedSeller: subscribed,
    allowMultipleCategories: subscribed,
    allowSubcategories: true,
    mainCategoryOptions: SELLER_MAIN_CATEGORIES,
    categoryHint: subscribed
      ? "Choose main, sub-category, and product type."
      : "Free plan: choose one category path (Main → Sub → Type) for your entire catalog. You can add unlimited products under that same path.",
  };
}

/**
 * Validate and normalize category for seller plan.
 */
export async function resolveSellerCategory(
  seller,
  categoryInput,
  { excludeProductId = null, premiumType } = {}
) {
  const subscribed = isSubscribedSeller(seller);
  const raw = String(categoryInput ?? "").trim();
  const typeInput =
    premiumType !== undefined ? String(premiumType || "").trim() : undefined;

  if (subscribed) {
    if (raw === "" && !typeInput) {
      return {
        category: "Uncategorized",
        premiumType: typeInput,
      };
    }
    assertCategoryPathResolved(raw, typeInput ?? "");
    const category = raw !== "" ? raw : "Uncategorized";
    return {
      category,
      premiumType: typeInput,
    };
  }

  assertCategoryPathResolved(raw, typeInput ?? "");

  const incoming = normalizeCategoryPath(raw, typeInput ?? "");

  if (!isCompleteCategoryPath(incoming)) {
    const err = new Error(
      "Free plan requires Main Category, Sub-Category, and Type for each product."
    );
    err.statusCode = 400;
    throw err;
  }

  const locked = await getSellerLockedCategoryPath(seller._id, excludeProductId);

  if (locked && !categoryPathsEqual(incoming, locked)) {
    throw createFreePlanCategoryPathError();
  }

  return buildCategoryFieldsFromPath(incoming);
}

export async function validateBulkProductCategories(seller, rows) {
  if (isSubscribedSeller(seller)) return;

  const locked = await getSellerLockedCategoryPath(seller._id);
  const paths = new Set();

  for (const row of rows) {
    const incoming = normalizeCategoryPath(row.category, row.premiumType || row.type);
    if (!isCompleteCategoryPath(incoming)) {
      const err = new Error(
        "Each row must include Main Category, Sub-Category, and Type on the free plan."
      );
      err.statusCode = 400;
      throw err;
    }
    paths.add(`${incoming.main}::${incoming.sub}::${incoming.type}`);
    if (locked && !categoryPathsEqual(incoming, locked)) {
      throw createFreePlanCategoryPathError();
    }
  }

  if (!locked && paths.size > 1) {
    throw createFreePlanCategoryPathError(
      "Bulk upload includes multiple category paths. Free plan allows one path — use a single category in your CSV or upgrade to Premium."
    );
  }
}

export async function getSellerCategoryLimitsForApi(seller) {
  const plan = getCategoryPlanLimits(seller);
  const lockedPath = !plan.allowMultipleCategories
    ? await getSellerLockedCategoryPath(seller._id)
    : null;

  const dbCategories = await Category.find({ isActive: true }).populate("parentCategory", "name");
  const baseTaxonomy = getCategoryTaxonomyForApi();

  for (const cat of dbCategories) {
    if (!cat.parentCategory) {
      if (!baseTaxonomy.mains.includes(cat.name)) {
        const otherIndex = baseTaxonomy.mains.indexOf(baseTaxonomy.otherLabel);
        if (otherIndex > -1) {
          baseTaxonomy.mains.splice(otherIndex, 0, cat.name);
        } else {
          baseTaxonomy.mains.push(cat.name);
        }
      }
      if (!baseTaxonomy.subcategoriesByMain[cat.name]) {
        baseTaxonomy.subcategoriesByMain[cat.name] = [baseTaxonomy.otherLabel];
      }
      if (!baseTaxonomy.typesByMainSub[cat.name]) {
        baseTaxonomy.typesByMainSub[cat.name] = {};
      }
    } else {
      const mainName = cat.parentCategory.name;
      if (!baseTaxonomy.mains.includes(mainName)) {
        const otherIndex = baseTaxonomy.mains.indexOf(baseTaxonomy.otherLabel);
        if (otherIndex > -1) {
          baseTaxonomy.mains.splice(otherIndex, 0, mainName);
        } else {
          baseTaxonomy.mains.push(mainName);
        }
      }

      if (cat.subCategory) {
        if (!baseTaxonomy.subcategoriesByMain[mainName]) {
          baseTaxonomy.subcategoriesByMain[mainName] = [baseTaxonomy.otherLabel];
        }
        if (!baseTaxonomy.subcategoriesByMain[mainName].includes(cat.subCategory)) {
          const otherIndex = baseTaxonomy.subcategoriesByMain[mainName].indexOf(baseTaxonomy.otherLabel);
          if (otherIndex > -1) {
            baseTaxonomy.subcategoriesByMain[mainName].splice(otherIndex, 0, cat.subCategory);
          } else {
            baseTaxonomy.subcategoriesByMain[mainName].push(cat.subCategory);
          }
        }

        if (cat.productType) {
          if (!baseTaxonomy.typesByMainSub[mainName]) {
            baseTaxonomy.typesByMainSub[mainName] = {};
          }
          if (!baseTaxonomy.typesByMainSub[mainName][cat.subCategory]) {
            baseTaxonomy.typesByMainSub[mainName][cat.subCategory] = [baseTaxonomy.otherLabel];
          }
          if (!baseTaxonomy.typesByMainSub[mainName][cat.subCategory].includes(cat.productType)) {
            const otherIndex = baseTaxonomy.typesByMainSub[mainName][cat.subCategory].indexOf(baseTaxonomy.otherLabel);
            if (otherIndex > -1) {
              baseTaxonomy.typesByMainSub[mainName][cat.subCategory].splice(otherIndex, 0, cat.productType);
            } else {
              baseTaxonomy.typesByMainSub[mainName][cat.subCategory].push(cat.productType);
            }
          }
        }
      }
    }
  }

  return {
    ...plan,
    lockedCategoryPath: serializeLockedCategoryPathForApi(lockedPath),
    /** @deprecated use lockedCategoryPath */
    lockedMainCategory: lockedPath?.mainDisplay || lockedPath?.main || null,
    taxonomy: baseTaxonomy,
  };
}
