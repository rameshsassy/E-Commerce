const DEFAULT_MIN = 1;
const DEFAULT_MAX_FREE = 5;
const DEFAULT_MAX_PREMIUM = 100;

export function getMaxOrderQuantityLimit(seller) {
  const subscribed =
    seller?.sellerType === "premium" && seller?.subscriptionActive === true;
  return subscribed ? DEFAULT_MAX_PREMIUM : DEFAULT_MAX_FREE;
}

export function validateOrderQuantityFields(body, seller, { partial = false } = {}) {
  const limit = getMaxOrderQuantityLimit(seller);
  const result = {};

  let minQty = body.minOrderQuantity;
  if (minQty !== undefined && minQty !== "") {
    minQty = Number(minQty);
    if (!Number.isFinite(minQty) || minQty < 1) {
      const err = new Error("Minimum order quantity must be at least 1.");
      err.statusCode = 400;
      throw err;
    }
    result.minOrderQuantity = Math.floor(minQty);
  } else if (!partial) {
    result.minOrderQuantity = DEFAULT_MIN;
  }

  let maxQty = body.maxOrderQuantity;
  if (maxQty !== undefined && maxQty !== "") {
    maxQty = Number(maxQty);
    if (!Number.isFinite(maxQty) || maxQty < 1) {
      const err = new Error("Maximum order quantity must be at least 1.");
      err.statusCode = 400;
      throw err;
    }
    if (maxQty > limit) {
      const err = new Error(`Maximum order quantity cannot exceed ${limit}.`);
      err.statusCode = 400;
      throw err;
    }
    result.maxOrderQuantity = Math.floor(maxQty);
  } else if (!partial) {
    result.maxOrderQuantity = limit;
  }

  const min = result.minOrderQuantity ?? DEFAULT_MIN;
  const max = result.maxOrderQuantity ?? limit;
  if (min > max) {
    const err = new Error(
      "Minimum order quantity cannot be greater than maximum order quantity."
    );
    err.statusCode = 400;
    throw err;
  }

  return result;
}

export function applyOrderQuantityFields(product, values) {
  if (values.minOrderQuantity !== undefined) {
    product.minOrderQuantity = values.minOrderQuantity;
  }
  if (values.maxOrderQuantity !== undefined) {
    product.maxOrderQuantity = values.maxOrderQuantity;
  }
  return product;
}
