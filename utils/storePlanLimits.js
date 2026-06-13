import { isSubscribedSeller } from "./productInventoryRules.js";

export const PLAN_ERROR_CODE = "PREMIUM_REQUIRED";

/** Free sellers: one storefront. Premium: multiple (capped). */
export const FREE_MAX_STORES = 1;
export const PRO_MAX_STORES = 5;
export const PREMIUM_MAX_STORES = 999999;

export function getStorePlanLimits(seller) {
  const subscribed = isSubscribedSeller(seller);
  const plan = seller?.subscriptionPlan || (subscribed ? "premium" : "free");
  
  let maxStores = FREE_MAX_STORES;
  if (plan === "premium") {
    maxStores = PREMIUM_MAX_STORES;
  } else if (plan === "pro") {
    maxStores = PRO_MAX_STORES;
  }

  const maxStoresLabel = maxStores >= 999999 ? "unlimited" : maxStores;

  return {
    isSubscribedSeller: subscribed,
    maxStores,
    allowMultipleAddresses: subscribed,
    storeAddressHint: subscribed
      ? `Add extra pickup or warehouse addresses below (up to ${maxStoresLabel}).`
      : "Free plan includes one store address only.",
  };
}

export function createPremiumRequiredError(message, upgradeFeature = "premium") {
  const err = new Error(message);
  err.statusCode = 403;
  err.code = PLAN_ERROR_CODE;
  err.upgradeFeature = upgradeFeature;
  return err;
}

export function assertCanCreateStore(seller, currentStoreCount) {
  const { maxStores } = getStorePlanLimits(seller);
  if (currentStoreCount >= maxStores) {
    const plan = seller?.subscriptionPlan || (isSubscribedSeller(seller) ? "premium" : "free");
    if (plan === "free") {
      throw createPremiumRequiredError(
        "Free plan includes one store only. Upgrade to Pro or Premium to create additional stores.",
        "multiple_stores"
      );
    } else if (plan === "pro") {
      throw createPremiumRequiredError(
        "Pro plan includes up to 5 stores. Upgrade to Premium to create unlimited stores.",
        "multiple_stores"
      );
    } else {
      const err = new Error(`You can create up to ${maxStores} stores on your plan.`);
      err.statusCode = 400;
      throw err;
    }
  }
}
