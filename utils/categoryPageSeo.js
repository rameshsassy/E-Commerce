/**
 * Public category listing SEO — Main + Sub + Type + Aashansh.
 * Example: Fashion | Shirt | Men | Aashansh
 */

export const AASHANSH_BRAND_NAME = "Aashansh";
export const AASHANSH_FAVICON_PATH = "/brand/aashansh-favicon.png";

export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** URL slug → display label (fashion → Fashion, mens-wear → Mens Wear) */
export function categorySlugToLabel(slug) {
  if (!slug) return "";
  return decodeURIComponent(String(slug))
    .replace(/-/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Display label → URL slug */
export function categoryLabelToSlug(label) {
  return encodeURIComponent(
    String(label || "")
      .trim()
      .toLowerCase()
      .replace(/['']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  );
}

export function parseCategoryString(categoryValue) {
  const raw = String(categoryValue || "").trim();
  if (!raw) return { main: "", sub: "" };
  const parts = raw.split("/").map((p) => p.trim()).filter(Boolean);
  return { main: parts[0] || "", sub: parts[1] || "" };
}

/**
 * Normalize category filters from query string or legacy `category` param.
 */
export function resolveCategoryParams({ main, sub, type, category } = {}) {
  let mainCat = String(main || "").trim();
  let subCat = String(sub || "").trim();
  const typeCat = String(type || "").trim();

  if (!mainCat && category) {
    const parsed = parseCategoryString(category);
    mainCat = parsed.main;
    if (!subCat) subCat = parsed.sub;
  }

  return {
    main: mainCat,
    sub: subCat,
    type: typeCat,
  };
}

export function buildCategoryHeading({ main, sub, type }) {
  const parts = [main, sub, type].filter(Boolean);
  if (parts.length === 0) return "All Products";
  return parts.join(" › ");
}

export function buildCategoryPageSeo({ main, sub, type } = {}) {
  const parts = [main, sub, type].filter(Boolean);

  if (parts.length === 0) {
    return {
      metaTitle: `${AASHANSH_BRAND_NAME} - Shop Fashion, Electronics, Grocery & More Online`,
      metaDescription:
        "Discover handcrafted and premium products on Aashansh. Shop by category — fashion, beauty, electronics, grocery, and more from verified sellers across India.",
      metaKeywords:
        "Aashansh, online shopping India, marketplace, fashion, electronics, buy online",
      heading: "All Products",
      breadcrumb: [],
      searchPhrase: "",
    };
  }

  const coreLabel = parts.join(" | ");
  const searchPhrase = [type, sub, main].filter(Boolean).join(" ").trim();
  const searchLower = searchPhrase.toLowerCase();

  const keywordBits = [
    ...parts,
    searchLower,
    sub && type ? `${sub} for ${type}`.toLowerCase() : "",
    sub ? `buy ${sub} online`.toLowerCase() : "",
    main && sub ? `${main} ${sub}`.toLowerCase() : "",
    `${AASHANSH_BRAND_NAME.toLowerCase()} marketplace`,
    "online shopping India",
  ].filter(Boolean);

  const metaTitle = `${coreLabel} | Buy Online | ${AASHANSH_BRAND_NAME}`;
  const metaDescription = `Shop ${searchPhrase} on ${AASHANSH_BRAND_NAME}. Find ${searchLower} from verified sellers — quality products, secure checkout, and delivery across India.`;

  return {
    metaTitle,
    metaDescription,
    metaKeywords: [...new Set(keywordBits)].join(", "),
    heading: buildCategoryHeading({ main, sub, type }),
    breadcrumb: parts,
    searchPhrase,
    main,
    sub,
    type,
  };
}

/**
 * MongoDB filter for approved products matching main / sub / type.
 */
export function buildCategoryProductFilter({ main, sub, type, legacyCategory } = {}) {
  const resolved = resolveCategoryParams({ main, sub, type, category: legacyCategory });
  const { main: mainCat, sub: subCat, type: typeCat } = resolved;

  if (!mainCat && !subCat && !typeCat && legacyCategory) {
    const legacy = String(legacyCategory).trim();
    return {
      category: new RegExp(escapeRegex(legacy), "i"),
    };
  }

  const clauses = [];

  if (mainCat) {
    const m = escapeRegex(mainCat);
    clauses.push({
      category: new RegExp(`^${m}(\\s*/\\s*|\\s*$)`, "i"),
    });
  }

  if (subCat) {
    const s = escapeRegex(subCat);
    clauses.push({
      category: new RegExp(`/\\s*${s}(\\s*/\\s*|\\s*$)`, "i"),
    });
  }

  if (typeCat) {
    const t = escapeRegex(typeCat);
    clauses.push({
      premiumType: new RegExp(`^${t}$`, "i"),
    });
  }

  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

export function buildCategoryCanonicalPath({ main, sub, type }) {
  if (!main) return "/products";
  let path = `/products/category/${categoryLabelToSlug(main)}`;
  if (sub) path += `/${categoryLabelToSlug(sub)}`;
  if (type) path += `/${categoryLabelToSlug(type)}`;
  return path;
}
