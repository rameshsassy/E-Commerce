import path from "path";
import fs from "fs";
import os from "os";

/**
 * True on Vercel / AWS Lambda / Netlify where the project disk is read-only
 * except /tmp (or similar).
 */
function isServerlessFilesystem() {
  return (
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.NETLIFY)
  );
}

/**
 * Absolute path to the uploads root (writable on serverless: os.tmpdir()/uploads).
 * Override with UPLOAD_DIR for Docker / custom hosts.
 */
export function getUploadsRoot() {
  if (process.env.UPLOAD_DIR) {
    return path.resolve(process.env.UPLOAD_DIR);
  }
  if (isServerlessFilesystem()) {
    return path.join(os.tmpdir(), "uploads");
  }
  return path.join(process.cwd(), "uploads");
}

/**
 * Create uploads root if possible. Never throws (avoids crashing module load on odd FS).
 */
export function ensureUploadsRoot() {
  const root = getUploadsRoot();
  try {
    fs.mkdirSync(root, { recursive: true });
  } catch (err) {
    console.warn("[uploads] Could not create uploads root:", root, err?.message || err);
  }
  return root;
}

/**
 * Multer returns absolute paths. Normalize to web path stored in DB and used in URLs:
 * "uploads/products/123-file.jpg"
 */
export function absoluteToWebPath(absPath) {
  if (!absPath || typeof absPath !== "string") return absPath;
  const normalized = path.resolve(absPath).replace(/\\/g, "/");
  const root = path.resolve(getUploadsRoot()).replace(/\\/g, "/");
  if (normalized.startsWith(root)) {
    const rel = normalized.slice(root.length).replace(/^\/+/, "");
    return path.posix.join("uploads", ...rel.split("/").filter(Boolean));
  }
  const forward = absPath.replace(/\\/g, "/");
  const marker = "/uploads/";
  const idx = forward.indexOf(marker);
  if (idx !== -1) {
    return forward.slice(idx + 1);
  }
  return forward;
}
