import { DELIVERY_BY_OPTIONS } from "../data/indiaLocations.js";

const PINCODE_RE = /^\d{6}$/;

export function parseDeliveryValues(input) {
  if (input === undefined || input === null || input === "") return [];
  if (Array.isArray(input)) {
    return input.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v).trim()).filter(Boolean);
      }
    } catch {
      return input
        .split(/[,;\n]+/)
        .map((v) => v.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function validateDeliveryFields(
  body,
  { partial = false, requireIfPhysical = false, existing = {} } = {}
) {
  const isPhysical =
    body.isPhysicalProduct === undefined ||
    body.isPhysicalProduct === true ||
    body.isPhysicalProduct === "true";

  if (!isPhysical && !body.deliveryBy) {
    return {
      deliveryBy: existing.deliveryBy,
      deliveryValues: existing.deliveryValues || [],
    };
  }

  const deliveryBy = body.deliveryBy ?? existing.deliveryBy ?? "";
  const allowed = DELIVERY_BY_OPTIONS.map((o) => o.value);

  if (!deliveryBy) {
    if (requireIfPhysical && isPhysical && !partial) {
      const err = new Error("Please select a delivery option under Shipping.");
      err.statusCode = 400;
      throw err;
    }
    if (partial) {
      return {
        deliveryBy: existing.deliveryBy,
        deliveryValues: existing.deliveryValues || [],
      };
    }
    return { deliveryBy: undefined, deliveryValues: [] };
  }

  if (!allowed.includes(deliveryBy)) {
    const err = new Error("Invalid delivery type.");
    err.statusCode = 400;
    throw err;
  }

  const deliveryValues = parseDeliveryValues(body.deliveryValues);
  if (!partial && deliveryValues.length === 0) {
    const err = new Error("Please enter delivery details for the selected option.");
    err.statusCode = 400;
    throw err;
  }

  if (deliveryBy === "pincode") {
    for (const pin of deliveryValues) {
      if (!PINCODE_RE.test(pin)) {
        const err = new Error(
          `Invalid pincode "${pin}". Use 6-digit Indian pincodes.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }

  return { deliveryBy, deliveryValues };
}

export function applyDeliveryFields(product, delivery) {
  if (delivery.deliveryBy !== undefined) {
    product.deliveryBy = delivery.deliveryBy;
  }
  if (delivery.deliveryValues !== undefined) {
    product.deliveryValues = delivery.deliveryValues;
  }
  return product;
}
