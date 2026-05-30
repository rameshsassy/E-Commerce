import { isOtherCategoryLabel } from './sellerCategoryOther';

export const FREE_PLAN_CATEGORY_PATH_MESSAGE =
  'You are on the Free Plan. You can add products only under your selected category. Upgrade to Premium to add products in multiple categories.';

export function normalizeCategoryPath(categoryValue, premiumType = '') {
  const raw = String(categoryValue || '').trim();
  const parts = raw
    ? raw.split('/').map((p) => p.trim()).filter(Boolean)
    : [];
  const main = parts[0] || '';
  const sub = parts[1] || '';
  const type = String(premiumType || '').trim();
  return {
    main: main.toLowerCase(),
    sub: sub.toLowerCase(),
    type: type.toLowerCase(),
    mainDisplay: parts[0] || '',
    subDisplay: parts[1] || '',
    typeDisplay: type,
  };
}

export function isCompleteCategoryPath(path) {
  if (!path?.main || !path?.sub || !path?.type) return false;
  if (
    isOtherCategoryLabel(path.mainDisplay) ||
    isOtherCategoryLabel(path.subDisplay) ||
    isOtherCategoryLabel(path.typeDisplay)
  ) {
    return false;
  }
  return true;
}

export function categoryPathsEqual(a, b) {
  if (!a || !b) return false;
  return a.main === b.main && a.sub === b.sub && a.type === b.type;
}

export function formatCategoryPathLabel(path) {
  if (!path) return '';
  const main = path.main || path.mainDisplay;
  const sub = path.sub || path.subDisplay;
  const type = path.typeDisplay || path.type;
  if (!main) return '';
  if (!sub) return `${path.mainDisplay || main} → ${path.subDisplay || sub}`.replace(/^ → /, '');
  const m = path.mainDisplay || main;
  const s = path.subDisplay || sub;
  const t = path.typeDisplay || type;
  return `${m} → ${s} → ${t}`;
}

export function pathFromProductData(productData) {
  return normalizeCategoryPath(productData?.category, productData?.premiumType);
}

export function pathFromApiLocked(locked) {
  if (!locked?.main || !locked?.sub || !locked?.type) return null;
  return normalizeCategoryPath(
    `${locked.main} / ${locked.sub}`,
    locked.type
  );
}

/**
 * @returns {{ ok: true } | { ok: false, reason: 'incomplete' | 'mismatch' }}
 */
export function validateFreeSellerCategorySelection(productData, inventoryOptions) {
  if (inventoryOptions?.isSubscribedSeller !== false) {
    return { ok: true };
  }

  const incoming = pathFromProductData(productData);
  if (!isCompleteCategoryPath(incoming)) {
    return { ok: false, reason: 'incomplete' };
  }

  const locked = pathFromApiLocked(inventoryOptions?.categoryLimits?.lockedCategoryPath);
  if (locked && !categoryPathsEqual(incoming, locked)) {
    return { ok: false, reason: 'mismatch' };
  }

  return { ok: true };
}
