export const PURCHASE_TYPE = {
  ONE_TIME: "one_time",
  SUBSCRIPTION: "subscription",
  CUSTOM_ORDER: "custom_order",
};

export const PURCHASE_TYPE_LABELS = {
  [PURCHASE_TYPE.ONE_TIME]: "One-time purchase",
  [PURCHASE_TYPE.SUBSCRIPTION]: "Subscription",
  [PURCHASE_TYPE.CUSTOM_ORDER]: "Custom Order",
};

export function isSubscribedSeller(seller) {
  return (
    seller?.sellerType === "premium" && seller?.subscriptionActive === true
  );
}

/** Options shown to seller; subscription/custom only selectable when subscribed. */
export function getPurchaseTypeOptionsForSeller(seller) {
  const subscribed = isSubscribedSeller(seller);
  return [
    {
      value: PURCHASE_TYPE.ONE_TIME,
      label: PURCHASE_TYPE_LABELS[PURCHASE_TYPE.ONE_TIME],
      available: true,
      note: null,
    },
    {
      value: PURCHASE_TYPE.SUBSCRIPTION,
      label: PURCHASE_TYPE_LABELS[PURCHASE_TYPE.SUBSCRIPTION],
      available: subscribed,
      note: "Only application for subscribed sellers",
    },
    {
      value: PURCHASE_TYPE.CUSTOM_ORDER,
      label: PURCHASE_TYPE_LABELS[PURCHASE_TYPE.CUSTOM_ORDER],
      available: subscribed,
      note: "Only application for subscribed sellers",
    },
  ];
}

export function parseShipFromStoreAddresses(input) {
  if (input === undefined || input === null || input === "") return [];
  if (Array.isArray(input)) {
    return input.map((a) => String(a).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((a) => String(a).trim()).filter(Boolean);
      }
    } catch {
      return input
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);
    }
  }
  return [];
}

/**
 * Validate purchase type & store address rules. Returns normalized values to save.
 */
export function validateInventoryFields(seller, body, { partial = false, requireStoreAddress = false } = {}) {
  const sellerAddresses = (seller.storeAddresses || [])
    .map((a) => String(a).trim())
    .filter(Boolean);

  const result = {};

  const purchaseType = body.purchaseType ?? (partial ? undefined : PURCHASE_TYPE.ONE_TIME);
  if (purchaseType !== undefined) {
    const allowed = Object.values(PURCHASE_TYPE);
    if (!allowed.includes(purchaseType)) {
      const err = new Error("Invalid purchase type");
      err.statusCode = 400;
      throw err;
    }
    if (
      (purchaseType === PURCHASE_TYPE.SUBSCRIPTION ||
        purchaseType === PURCHASE_TYPE.CUSTOM_ORDER) &&
      !isSubscribedSeller(seller)
    ) {
      const err = new Error(
        `${PURCHASE_TYPE_LABELS[purchaseType]} is only available for subscribed sellers. Upgrade to premium to use this option.`
      );
      err.statusCode = 403;
      err.code = "PREMIUM_REQUIRED";
      err.upgradeFeature = "premium";
      throw err;
    }
    result.purchaseType = purchaseType;
  }

  let addresses;
  if (body.shipFromStoreAddresses !== undefined) {
    addresses = parseShipFromStoreAddresses(body.shipFromStoreAddresses);
  } else if (!partial) {
    addresses = [];
  }

  if (addresses !== undefined) {
    if (addresses.length > 0) {
      for (const addr of addresses) {
        if (!sellerAddresses.includes(addr)) {
          const err = new Error(
            `Store address "${addr}" is not registered on your seller profile. Add it in KYC first.`
          );
          err.statusCode = 400;
          throw err;
        }
      }
      if (!isSubscribedSeller(seller) && addresses.length > 1) {
        const err = new Error(
          "Only one store address allowed for free users. Subscribe to select multiple addresses."
        );
        err.statusCode = 403;
        throw err;
      }
    }

    if (requireStoreAddress && sellerAddresses.length > 0 && addresses.length === 0) {
      const err = new Error(
        "Select at least one store address to ship this product from."
      );
      err.statusCode = 400;
      throw err;
    }

    result.shipFromStoreAddresses = addresses;
  }

  return result;
}

export function applyInventoryFields(product, inventoryValues) {
  if (inventoryValues.purchaseType !== undefined) {
    product.purchaseType = inventoryValues.purchaseType;
  }
  if (inventoryValues.shipFromStoreAddresses !== undefined) {
    product.shipFromStoreAddresses = inventoryValues.shipFromStoreAddresses;
  }
  return product;
}
