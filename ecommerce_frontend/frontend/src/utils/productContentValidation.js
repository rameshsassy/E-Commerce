export const PRODUCT_TITLE_MAX = 1200;
export const PRODUCT_DESCRIPTION_MAX = 1500;
export const PRODUCT_IMAGE_MAX_COUNT = 5;
export const PRODUCT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const POLICY_TERMS_MAX = 150;
export const CARE_INSTRUCTIONS_MAX = 1500;
export const KEY_HIGHLIGHTS_MAX = 1500;

export const DEFAULT_POLICIES = {
  return: { enabled: false, terms: '' },
  replacement: { enabled: false, terms: '' },
  refund: { enabled: false, terms: '' },
};

/** Fresh copy so toggles/inputs never mutate the shared default. */
export function clonePolicies(policies) {
  const src = policies || DEFAULT_POLICIES;
  return {
    return: {
      enabled: src.return?.enabled === true,
      terms: src.return?.terms || '',
    },
    replacement: {
      enabled: src.replacement?.enabled === true,
      terms: src.replacement?.terms || '',
    },
    refund: {
      enabled: src.refund?.enabled === true,
      terms: src.refund?.terms || '',
    },
  };
}

const EXTERNAL_LINK_RE =
  /(?:https?:\/\/|www\.\w+)|\b[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|in|edu|gov|uk|us|info|biz)\b/i;

export function hasExternalLinks(text) {
  if (!text) return false;
  return EXTERNAL_LINK_RE.test(String(text).trim());
}

export function htmlToPlainText(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

export function getProductTitleValidation(title) {
  const len = (title || '').length;
  return {
    len,
    tooLong: len > PRODUCT_TITLE_MAX,
    externalLinks: hasExternalLinks(title),
    looksGood: len > 0 && len <= PRODUCT_TITLE_MAX && !hasExternalLinks(title),
  };
}

export function getProductDescriptionValidation(html) {
  const plain = htmlToPlainText(html);
  const len = plain.length;
  return {
    len,
    tooLong: len > PRODUCT_DESCRIPTION_MAX,
    externalLinks: hasExternalLinks(plain) || hasExternalLinks(html),
    looksGood:
      len > 0 && len <= PRODUCT_DESCRIPTION_MAX && !hasExternalLinks(plain) && !hasExternalLinks(html),
  };
}

export function getPolicyTermsValidation(terms, enabled) {
  const text = terms || '';
  const len = text.length;
  if (!enabled) {
    return { len: 0, tooLong: false, externalLinks: false, looksGood: true };
  }
  return {
    len,
    tooLong: len > POLICY_TERMS_MAX,
    externalLinks: hasExternalLinks(text),
    looksGood:
      len > 0 && len <= POLICY_TERMS_MAX && !hasExternalLinks(text),
  };
}

export function getCareInstructionsValidation(html) {
  const plain = htmlToPlainText(html);
  const len = plain.length;
  if (!len) {
    return { len: 0, tooLong: false, externalLinks: false, looksGood: true };
  }
  return {
    len,
    tooLong: len > CARE_INSTRUCTIONS_MAX,
    externalLinks: hasExternalLinks(plain) || hasExternalLinks(html),
    looksGood:
      len > 0 &&
      len <= CARE_INSTRUCTIONS_MAX &&
      !hasExternalLinks(plain) &&
      !hasExternalLinks(html),
  };
}

export function getKeyHighlightsValidation(html) {
  const plain = htmlToPlainText(html);
  const len = plain.length;
  if (!len) {
    return { len: 0, tooLong: false, externalLinks: false, looksGood: true };
  }
  return {
    len,
    tooLong: len > KEY_HIGHLIGHTS_MAX,
    externalLinks: hasExternalLinks(plain) || hasExternalLinks(html),
    looksGood:
      len > 0 &&
      len <= KEY_HIGHLIGHTS_MAX &&
      !hasExternalLinks(plain) &&
      !hasExternalLinks(html),
  };
}

export function isProductBasicInfoValid(productData) {
  const titleOk = getProductTitleValidation(productData.title).looksGood;
  const descOk = getProductDescriptionValidation(productData.description).looksGood;
  const keywordCount = (productData.keywords || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean).length;
  const keywordsOk = keywordCount <= 5;
  return titleOk && descOk && keywordsOk;
}

/** If seller wrote terms, treat policy as enabled for save. */
export function normalizePoliciesForSave(policies) {
  const next = clonePolicies(policies);
  for (const key of ['return', 'replacement', 'refund']) {
    const p = next[key];
    if (p.enabled) {
      p.terms = (p.terms || '').trim().slice(0, POLICY_TERMS_MAX);
    } else {
      p.enabled = false;
      p.terms = '';
    }
  }
  return next;
}

export function isProductPolicyCareValid(productData) {
  const policies = normalizePoliciesForSave(productData.policies);
  const policiesOk = ['return', 'replacement', 'refund'].every((key) => {
    const p = policies[key] || DEFAULT_POLICIES[key];
    return getPolicyTermsValidation(p.terms, p.enabled).looksGood;
  });
  const careOk = getCareInstructionsValidation(productData.careInstructions || '').looksGood;
  const highlightsOk = getKeyHighlightsValidation(productData.keyHighlights || '').looksGood;
  return policiesOk && careOk && highlightsOk;
}

export function isProductPricingInventoryValid(productData, inventoryOptions) {
  const price = Number(productData.price);
  if (!Number.isFinite(price) || price < 0) return false;

  const minQty = Number(productData.minOrderQuantity);
  const maxQty = Number(productData.maxOrderQuantity);
  const maxLimit = inventoryOptions?.maxOrderQuantityLimit ?? 5;

  if (!Number.isFinite(minQty) || minQty < 1) return false;
  if (!Number.isFinite(maxQty) || maxQty < 1 || maxQty > maxLimit) return false;
  if (minQty > maxQty) return false;

  if (productData.bulkPurchaseEnabled === true) {
    const b2bMin = Number(productData.bulkPurchaseMinOrderQuantity);
    if (!Number.isFinite(b2bMin) || b2bMin < 1) return false;
  }

  return true;
}

export function isProductFormContentValid(productData, inventoryOptions = null) {
  return (
    isProductBasicInfoValid(productData) &&
    isProductPolicyCareValid(productData) &&
    isProductPricingInventoryValid(productData, inventoryOptions)
  );
}

export function alertNoLinks() {
  window.alert('No links');
}
