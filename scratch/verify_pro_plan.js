import { isSubscribedSeller } from "../utils/productInventoryRules.js";
import { getMaxOrderQuantityLimit } from "../utils/productOrderQuantity.js";
import { getStorePlanLimits, assertCanCreateStore } from "../utils/storePlanLimits.js";

const mockFree = {
  sellerType: "free",
  subscriptionPlan: "free",
  subscriptionActive: false,
};

const mockPro = {
  sellerType: "premium",
  subscriptionPlan: "pro",
  subscriptionActive: true,
};

const mockPremium = {
  sellerType: "premium",
  subscriptionPlan: "premium",
  subscriptionActive: true,
};

function runTest(name, fn) {
  try {
    fn();
    console.log(`✅ TEST PASSED: ${name}`);
  } catch (err) {
    console.error(`❌ TEST FAILED: ${name}`);
    console.error(err);
  }
}

// 1. isSubscribedSeller tests
runTest("isSubscribedSeller - Free", () => {
  const res = isSubscribedSeller(mockFree);
  if (res !== false) throw new Error(`Expected false, got ${res}`);
});

runTest("isSubscribedSeller - Pro", () => {
  const res = isSubscribedSeller(mockPro);
  if (res !== true) throw new Error(`Expected true, got ${res}`);
});

runTest("isSubscribedSeller - Premium", () => {
  const res = isSubscribedSeller(mockPremium);
  if (res !== true) throw new Error(`Expected true, got ${res}`);
});

// 2. getMaxOrderQuantityLimit tests
runTest("getMaxOrderQuantityLimit - Free", () => {
  const res = getMaxOrderQuantityLimit(mockFree);
  if (res !== 5) throw new Error(`Expected 5, got ${res}`);
});

runTest("getMaxOrderQuantityLimit - Pro", () => {
  const res = getMaxOrderQuantityLimit(mockPro);
  if (res !== 100) throw new Error(`Expected 100, got ${res}`);
});

runTest("getMaxOrderQuantityLimit - Premium", () => {
  const res = getMaxOrderQuantityLimit(mockPremium);
  if (res !== 100) throw new Error(`Expected 100, got ${res}`);
});

// 3. getStorePlanLimits tests
runTest("getStorePlanLimits - Free", () => {
  const limits = getStorePlanLimits(mockFree);
  if (limits.maxStores !== 1) throw new Error(`Expected maxStores=1, got ${limits.maxStores}`);
  if (limits.allowMultipleAddresses !== false) throw new Error(`Expected allowMultipleAddresses=false`);
  if (!limits.storeAddressHint.includes("Free plan")) throw new Error(`Wrong hint: ${limits.storeAddressHint}`);
});

runTest("getStorePlanLimits - Pro", () => {
  const limits = getStorePlanLimits(mockPro);
  if (limits.maxStores !== 5) throw new Error(`Expected maxStores=5, got ${limits.maxStores}`);
  if (limits.allowMultipleAddresses !== true) throw new Error(`Expected allowMultipleAddresses=true`);
  if (!limits.storeAddressHint.includes("up to 5")) throw new Error(`Wrong hint: ${limits.storeAddressHint}`);
});

runTest("getStorePlanLimits - Premium", () => {
  const limits = getStorePlanLimits(mockPremium);
  if (limits.maxStores !== 999999) throw new Error(`Expected maxStores=999999, got ${limits.maxStores}`);
  if (limits.allowMultipleAddresses !== true) throw new Error(`Expected allowMultipleAddresses=true`);
  if (!limits.storeAddressHint.includes("up to unlimited")) throw new Error(`Wrong hint: ${limits.storeAddressHint}`);
});

// 4. assertCanCreateStore tests
runTest("assertCanCreateStore - Free under limit", () => {
  assertCanCreateStore(mockFree, 0); // Should pass
});

runTest("assertCanCreateStore - Free at limit", () => {
  try {
    assertCanCreateStore(mockFree, 1);
    throw new Error("Expected it to throw");
  } catch (err) {
    if (!err.message.includes("Free plan includes one store only")) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
    if (err.upgradeFeature !== "multiple_stores" || err.statusCode !== 403) {
      throw new Error("Unexpected error properties");
    }
  }
});

runTest("assertCanCreateStore - Pro under limit", () => {
  assertCanCreateStore(mockPro, 4); // Should pass
});

runTest("assertCanCreateStore - Pro at limit", () => {
  try {
    assertCanCreateStore(mockPro, 5);
    throw new Error("Expected it to throw");
  } catch (err) {
    if (!err.message.includes("Pro plan includes up to 5 stores")) {
      throw new Error(`Unexpected error message: ${err.message}`);
    }
    if (err.upgradeFeature !== "multiple_stores" || err.statusCode !== 403) {
      throw new Error("Unexpected error properties");
    }
  }
});

runTest("assertCanCreateStore - Premium at limit", () => {
  assertCanCreateStore(mockPremium, 15); // Should pass
  assertCanCreateStore(mockPremium, 100); // Should pass
});

console.log("All verify checks ran!");
