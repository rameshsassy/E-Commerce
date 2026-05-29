import { normalizeSubdomain } from "./storeDomain.js";
import { isSubscribedSeller } from "./productInventoryRules.js";
import { createPremiumRequiredError } from "./storePlanLimits.js";

export const STORE_NAME_MAX = 1500;
export const STORE_ADDRESS_MAX = 500;
export const STORE_KEYWORDS_MAX = 5;

const EXTERNAL_LINK_RE =
  /(?:https?:\/\/|www\.\w+)|\b[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|in|edu|gov|uk|us|info|biz)\b/i;

export function hasExternalLinks(text) {
  if (!text || typeof text !== "string") return false;
  return EXTERNAL_LINK_RE.test(text.trim());
}

export function parseStoreKeywords(input) {
  if (input === undefined || input === null || input === "") return [];
  let list = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      list = Array.isArray(parsed) ? parsed : input.split(",");
    } catch {
      list = input.split(",");
    }
  }
  return list
    .map((k) => String(k).trim())
    .filter(Boolean)
    .slice(0, STORE_KEYWORDS_MAX);
}

export function parseAdditionalAddresses(input) {
  if (input === undefined || input === null || input === "") return [];
  let list = [];
  if (Array.isArray(input)) {
    list = input;
  } else if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      list = Array.isArray(parsed) ? parsed : [input];
    } catch {
      list = [input];
    }
  }
  return list
    .map((a) => String(a).trim())
    .filter(Boolean)
    .map((a) => a.slice(0, STORE_ADDRESS_MAX));
}

export function validateTextField(value, { fieldLabel, maxLength, required = false }) {
  const text = value != null ? String(value) : "";
  if (required && !text.trim()) {
    const err = new Error(`${fieldLabel} is required.`);
    err.statusCode = 400;
    throw err;
  }
  if (!text.trim()) return "";
  if (text.length > maxLength) {
    const err = new Error(
      `Oops! No more than ${maxLength} characters in ${fieldLabel.toLowerCase()}.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(text)) {
    const err = new Error("No external links allowed.");
    err.statusCode = 400;
    throw err;
  }
  return text.trim();
}

export function validateStoreKeywords(keywordsInput) {
  const keywords = parseStoreKeywords(keywordsInput);
  if (keywords.length > STORE_KEYWORDS_MAX) {
    const err = new Error(`Maximum ${STORE_KEYWORDS_MAX} keywords allowed.`);
    err.statusCode = 400;
    throw err;
  }
  for (const kw of keywords) {
    if (hasExternalLinks(kw)) {
      const err = new Error("No external links allowed in keywords.");
      err.statusCode = 400;
      throw err;
    }
    if (kw.length > 100) {
      const err = new Error("Each keyword must be 100 characters or less.");
      err.statusCode = 400;
      throw err;
    }
  }
  return keywords;
}

export function validateAdditionalAddresses(addressesInput) {
  const addresses = parseAdditionalAddresses(addressesInput);
  for (const addr of addresses) {
    validateTextField(addr, {
      fieldLabel: "Store address",
      maxLength: STORE_ADDRESS_MAX,
      required: true,
    });
  }
  return addresses;
}

export function slugFromStoreName(storeName) {
  return normalizeSubdomain(storeName) || "storename";
}

export function applyAdditionalAddressesForSeller(additionalAddresses, seller) {
  const subscribed = isSubscribedSeller(seller);
  if (!subscribed && additionalAddresses.length > 0) {
    throw createPremiumRequiredError(
      "Free sellers can save only one store address. Upgrade to premium to add more addresses.",
      "multiple_addresses"
    );
  }
  return subscribed ? additionalAddresses : [];
}

export function applyStoreContentFromBody(body, seller = null) {
  const storeName = validateTextField(body.storeName, {
    fieldLabel: "Store name",
    maxLength: STORE_NAME_MAX,
    required: true,
  });
  const detailedAddress = validateTextField(body.detailedAddress, {
    fieldLabel: "Store detailed address",
    maxLength: STORE_ADDRESS_MAX,
    required: true,
  });
  const keywords = validateStoreKeywords(body.keywords);
  let additionalAddresses = validateAdditionalAddresses(
    body.additionalAddresses
  );
  if (seller) {
    additionalAddresses = applyAdditionalAddressesForSeller(
      additionalAddresses,
      seller
    );
  }

  return {
    storeName,
    detailedAddress,
    keywords,
    additionalAddresses,
    subdomainFromName: slugFromStoreName(storeName),
  };
}
