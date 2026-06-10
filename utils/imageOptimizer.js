import fs from "fs";
import path from "path";
import sharp from "sharp";

const DEFAULT_MAX_BYTES = 100 * 1024;

export function getMaxImageBytes() {
  const raw = process.env.MAX_IMAGE_BYTES ?? process.env.MAX_IMAGE_KB;
  if (raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) {
      return String(raw).includes(".") || n > 512 ? Math.floor(n) : Math.floor(n * 1024);
    }
  }
  return DEFAULT_MAX_BYTES;
}

export const MAX_IMAGE_BYTES = getMaxImageBytes();

/**
 * Compress image buffer to <= maxBytes (default 100KB).
 * Converts to JPEG; reduces quality and dimensions iteratively.
 */
export async function optimizeImageBuffer(input, maxBytes = MAX_IMAGE_BYTES) {
  let width = 1200;
  let quality = 82;
  let buffer = null;

  for (let attempt = 0; attempt < 40; attempt++) {
    buffer = await sharp(input)
      .rotate()
      .resize(width, width, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true, progressive: true })
      .toBuffer();

    if (buffer.length <= maxBytes) {
      return buffer;
    }

    if (quality > 12) {
      quality -= 8;
      continue;
    }

    if (width > 120) {
      width = Math.max(120, Math.floor(width * 0.7));
      quality = 75;
      continue;
    }

    if (quality > 5) {
      quality = 5;
      continue;
    }

    break;
  }

  if (buffer && buffer.length > maxBytes) {
    buffer = await sharp(buffer)
      .resize(100, 100, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 5, mozjpeg: true })
      .toBuffer();
  }

  return buffer;
}

/**
 * Optimize file on disk: writes JPEG <= maxBytes and renames to .jpg when needed.
 */
export async function optimizeImageFile(filePath, maxBytes = MAX_IMAGE_BYTES) {
  const input = fs.readFileSync(filePath);
  const buffer = await optimizeImageBuffer(input, maxBytes);

  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  const jpgPath = path.join(dir, `${base}.jpg`);

  fs.writeFileSync(jpgPath, buffer);

  if (jpgPath !== filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  return { path: jpgPath, size: buffer.length };
}

function collectUploadedFiles(req) {
  const files = [];
  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === "object") {
    for (const fieldFiles of Object.values(req.files)) {
      if (Array.isArray(fieldFiles)) files.push(...fieldFiles);
    }
  }
  return files;
}

function isImageUpload(file) {
  if (!file) return false;
  if (file.mimetype?.startsWith("image/")) return true;
  const ext = path.extname(file.originalname || file.path || file.filename || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".heic", ".heif"].includes(ext);
}

function applyOptimizedFileMeta(file, optimizedPath, size) {
  const filename = path.basename(optimizedPath);
  file.path = optimizedPath;
  file.filename = filename;
  file.mimetype = "image/jpeg";
  file.size = size;
  if (file.originalname) {
    const stem = path.basename(file.originalname, path.extname(file.originalname));
    file.originalname = `${stem}.jpg`;
  }
}

/**
 * Express middleware: run after multer to compress all uploaded images to <= 100KB.
 */
export async function optimizeUploadedImages(req, res, next) {
  try {
    const files = collectUploadedFiles(req).filter(isImageUpload);
    for (const file of files) {
      if (file.path && fs.existsSync(file.path)) {
        let outPath, size;
        try {
          const result = await optimizeImageFile(file.path);
          outPath = result.path;
          size = result.size;
        } catch (optimizeError) {
          console.error("Optimization failed:", optimizeError);
          return res.status(400).json({
            message: "Image could not be optimized. Please upload a different image.",
          });
        }

        // Validate final format is JPG/JPEG
        const ext = path.extname(outPath).toLowerCase();
        if (ext !== ".jpg" && ext !== ".jpeg") {
          if (fs.existsSync(outPath)) {
            fs.unlinkSync(outPath);
          }
          return res.status(400).json({
            message: "Image could not be optimized. Please upload a different image.",
          });
        }

        // Reject images larger than 100 KB
        if (size > 100 * 1024) {
          if (fs.existsSync(outPath)) {
            fs.unlinkSync(outPath);
          }
          return res.status(400).json({
            message: "Image size must be less than 100 KB.",
          });
        }

        applyOptimizedFileMeta(file, outPath, size);
      }
    }
    next();
  } catch (err) {
    console.error("Uploaded image optimization error:", err);
    return res.status(400).json({
      message: "Image could not be optimized. Please upload a different image.",
    });
  }
}
