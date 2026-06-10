export const CATEGORY_OTHER_LABEL = 'Other (Please mention)';

const OTHER_LABEL_KEYS = new Set([
  'other (please mention)',
  'others (please mention)',
  'others (mention)',
  'other (mention)',
  'other',
]);

export function isOtherCategoryLabel(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase();
  return OTHER_LABEL_KEYS.has(key);
}

export function withOtherOption(list = []) {
  const items = Array.isArray(list) ? [...list] : [];
  if (!items.some((item) => isOtherCategoryLabel(item))) {
    items.push(CATEGORY_OTHER_LABEL);
  }
  return items;
}

/** Resolve dropdown label + optional custom text to stored value. */
export function resolveCategorySegment(label, customText) {
  if (!label) return '';
  if (isOtherCategoryLabel(label)) {
    return String(customText || '').trim();
  }
  return String(label).trim();
}

export function buildCategoryString(mainLabel, subLabel, otherMainText, otherSubText) {
  const main = resolveCategorySegment(mainLabel, otherMainText);
  const sub = resolveCategorySegment(subLabel, otherSubText);
  if (!main) return '';
  return sub ? `${main} / ${sub}` : main;
}

export function resolveTypeValue(typeLabel, otherTypeText) {
  return resolveCategorySegment(typeLabel, otherTypeText);
}
