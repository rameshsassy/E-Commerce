import fs from "fs";
import path from "path";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function renameFile(file, nextBaseName) {
  if (!file?.path) return;
  if (!fs.existsSync(file.path)) return;

  const dir = path.dirname(file.path);
  const ext = path.extname(file.path) || ".jpg";
  const safeBase = slugify(nextBaseName) || "aashansh-product";
  const outPath = path.join(dir, `${safeBase}${ext}`);

  if (outPath === file.path) return;

  // If collision, append timestamp.
  const finalPath = fs.existsSync(outPath)
    ? path.join(dir, `${safeBase}-${Date.now()}${ext}`)
    : outPath;

  fs.renameSync(file.path, finalPath);
  file.path = finalPath;
  file.filename = path.basename(finalPath);
}

/**
 * Rename uploaded product images to:
 * Aashansh + Brand name + product title
 *
 * Brand name is derived from seller businessName; falls back to "brand".
 * Runs after image optimization so extension is stable (.jpg).
 */
export function renameUploadedProductImages(req, _res, next) {
  try {
    const brandName = req.user?.businessName || "brand";
    const title = req.body?.title || "product";
    const base = `Aashansh ${brandName} ${title}`;

    // Multer fields() => req.files is object of arrays
    const images = req.files?.images || [];
    const variantImages = req.files?.variantImages || [];

    images.forEach((file, idx) => {
      renameFile(file, `${base} ${idx + 1}`);
    });
    variantImages.forEach((file, idx) => {
      renameFile(file, `${base} variant ${idx + 1}`);
    });

    next();
  } catch (e) {
    next(e);
  }
}

