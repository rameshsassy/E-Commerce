/** Client-side SEO title builder (matches backend utils/storeSeo.js) */
export function buildStoreMetaTitle(storeName, sellerLegalName) {
  const parts = ['Shop Now'];
  const name = String(storeName || '').trim();
  const legal = String(sellerLegalName || '').trim();
  if (name) parts.push(name);
  if (legal) parts.push(legal);
  return parts.join(' | ');
}

export function buildStoreMetaKeywords(keywords = []) {
  return (Array.isArray(keywords) ? keywords : [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .join(', ');
}

export function buildSeoPreviewFromForm(storeForm, sellerMeta = {}) {
  const keywords = (storeForm.keywordsInput || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const sellerLegalName =
    sellerMeta.officialName?.trim() || sellerMeta.businessName?.trim() || '';
  return {
    metaTitle: buildStoreMetaTitle(storeForm.storeName, sellerLegalName),
    metaDescription: sellerMeta.elevatorPitch?.trim() || '',
    metaKeywords: buildStoreMetaKeywords(keywords),
    sellerLegalName,
  };
}
