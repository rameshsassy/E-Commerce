/**
 * Store page SEO — title, description, keywords.
 * Title: Shop Now | Store name | Seller Legal Name
 * Description: seller elevator pitch (KYC)
 * Keywords: store keywords from create/edit store
 */

export function buildStoreMetaTitle(storeName, sellerLegalName) {
  const parts = ["Shop Now"];
  const name = String(storeName || "").trim();
  const legal = String(sellerLegalName || "").trim();
  if (name) parts.push(name);
  if (legal) parts.push(legal);
  return parts.join(" | ");
}

export function buildStoreMetaKeywords(keywords = []) {
  return (Array.isArray(keywords) ? keywords : [])
    .map((k) => String(k).trim())
    .filter(Boolean)
    .join(", ");
}

export function resolveSellerLegalName(seller) {
  if (!seller) return "";
  return (
    String(seller.officialName || "").trim() ||
    String(seller.businessName || "").trim()
  );
}

export function buildStoreSeo(store, seller) {
  const storeName = store?.storeName || "";
  const sellerLegalName = resolveSellerLegalName(seller);
  const elevatorPitch = String(seller?.elevatorPitch || store?.tagline || "").trim();
  const keywords = store?.keywords || [];

  return {
    metaTitle: buildStoreMetaTitle(storeName, sellerLegalName),
    metaDescription: elevatorPitch,
    metaKeywords: buildStoreMetaKeywords(keywords),
    sellerLegalName,
  };
}
