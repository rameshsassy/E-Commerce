/**
 * Category browse helpers — keep SEO slug logic aligned with backend utils/categoryPageSeo.js
 */

export const AASHANSH_FAVICON_HREF = '/brand/aashansh-favicon.png';

export function categorySlugToLabel(slug) {
  if (!slug) return '';
  return decodeURIComponent(String(slug))
    .replace(/-/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function categoryLabelToSlug(label) {
  return encodeURIComponent(
    String(label || '')
      .trim()
      .toLowerCase()
      .replace(/['']/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
  );
}

export function buildCategoryBrowsePath({ main, sub, type }) {
  if (!main) return '/products';
  let path = `/products/category/${categoryLabelToSlug(main)}`;
  if (sub) path += `/${categoryLabelToSlug(sub)}`;
  if (type) path += `/${categoryLabelToSlug(type)}`;
  return path;
}

export function resolveCategoryFromRoute(params = {}, searchParams) {
  const main = categorySlugToLabel(params.main) || searchParams.get('main') || '';
  const sub = categorySlugToLabel(params.sub) || searchParams.get('sub') || '';
  const type = categorySlugToLabel(params.type) || searchParams.get('type') || '';
  const legacyCategory = searchParams.get('category') || '';
  return { main, sub, type, legacyCategory };
}
