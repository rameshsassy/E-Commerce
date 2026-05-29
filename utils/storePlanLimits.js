import { isSubscribedSeller } from "./productInventoryRules.js";

export const PLAN_ERROR_CODE = "PREMIUM_REQUIRED";

/** Free sellers: one storefront. Premium: multiple (capped). */
export const FREE_MAX_STORES = 1;
export const PREMIUM_MAX_STORES = 10;

export function getStorePlanLimits(seller) {
  const subscribed = isSubscribedSeller(seller);
  const maxStores = subscribed ? PREMIUM_MAX_STORES : FREE_MAX_STORES;
  return {
    isSubscribedSeller: subscribed,
    maxStores,
    allowMultipleAddresses: subscribed,
    storeAddressHint: subscribed
      ? "Add extra pickup or warehouse addresses below."
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
  const { maxStores, isSubscribedSeller: subscribed } = getStorePlanLimits(seller);
  if (currentStoreCount >= maxStores) {
    if (!subscribed) {
      throw createPremiumRequiredError(
        "Free plan includes one store only. Upgrade to premium to create additional stores.",
        "multiple_stores"
      );
    }
    const err = new Error(`You can create up to ${maxStores} stores on your plan.`);
    err.statusCode = 400;
    throw err;
  }
}
