const EXTERNAL_LINK_RE =
  /(?:https?:\/\/|www\.\w+)|\b[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|in|edu|gov|uk|us|info|biz)\b/i;

export const PRODUCT_TITLE_MAX = 1200;
export const PRODUCT_DESCRIPTION_MAX = 1500;

export function hasExternalLinks(text) {
  if (!text || typeof text !== "string") return false;
  return EXTERNAL_LINK_RE.test(text.trim());
}

export function htmlToPlainText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function validateProductTitle(title) {
  const text = title != null ? String(title).trim() : "";
  if (!text) {
    const err = new Error("Product title is required.");
    err.statusCode = 400;
    throw err;
  }
  if (text.length > PRODUCT_TITLE_MAX) {
    const err = new Error(
      `Product title must be ${PRODUCT_TITLE_MAX} characters or less.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(text)) {
    const err = new Error("No external links allowed in product title.");
    err.statusCode = 400;
    throw err;
  }
  return text;
}

export function validateProductDescription(description) {
  const html = description != null ? String(description) : "";
  const plain = htmlToPlainText(html);
  if (!plain) {
    const err = new Error("Product description is required.");
    err.statusCode = 400;
    throw err;
  }
  if (plain.length > PRODUCT_DESCRIPTION_MAX) {
    const err = new Error(
      `Product description must be ${PRODUCT_DESCRIPTION_MAX} characters or less.`
    );
    err.statusCode = 400;
    throw err;
  }
  if (hasExternalLinks(plain) || hasExternalLinks(html)) {
    const err = new Error("No external links allowed in product description.");
    err.statusCode = 400;
    throw err;
  }
  return html;
}
