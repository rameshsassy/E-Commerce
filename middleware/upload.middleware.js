import multer from "multer";
import path from "path";
import fs from "fs";
import { getUploadsRoot } from "../utils/uploadPaths.js";
import { optimizeUploadedImages } from "../utils/imageOptimizer.js";

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const base = getUploadsRoot();
    let rel = "products";

    if (req.originalUrl.includes("kyc")) {
      rel = "kyc";
    } else if (req.originalUrl.includes("support")) {
      rel = "support";
    } else if (req.originalUrl.includes("/store")) {
      rel = "stores";
    } else if (req.originalUrl.includes("homepage")) {
      rel = "homepage";
    }

    const uploadPath = path.join(base, rel);
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.fieldname + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/csv",
  ];

  const isStoreImage =
    req.originalUrl.includes("/store") &&
    (file.fieldname === "logo" || file.fieldname === "favicon");

  if (isStoreImage) {
    if (["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(
      new Error("Store logo and favicon must be images (JPG, PNG, or WebP)."),
      false
    );
  }

  if (req.originalUrl.includes("/kyc")) {
    if (file.fieldname === "logo") {
      if (["image/jpeg", "image/png", "image/jpg"].includes(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error("Organization logo must be PNG or JPG format."), false);
    }
    if (file.fieldname === "registrationCertificate") {
      if (
        file.mimetype === "application/pdf" ||
        ["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.mimetype)
      ) {
        return cb(null, true);
      }
      return cb(
        new Error("Registration Certificate must be a PDF or image (JPG, PNG, or WebP)."),
        false
      );
    }
    if (file.fieldname === "orgPanImage" || file.fieldname === "gstImage") {
      if (["image/jpeg", "image/png", "image/jpg", "image/webp"].includes(file.mimetype)) {
        return cb(null, true);
      }
      return cb(new Error(`${file.fieldname} must be an image (JPG, PNG, or WebP).`), false);
    }
    if (file.fieldname === "cancelledCheckImage") {
      if (file.mimetype === "application/pdf") {
        return cb(null, true);
      }
      return cb(new Error("Cancelled cheque must be a PDF file."), false);
    }
  }

  if (allowed.includes(file.mimetype) || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed: " + file.mimetype), false);
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    // 3 MB — matches the client-side validation limit.
    // The imageOptimizer middleware compresses accepted images to ≤100 KB afterwards.
    fileSize: 3 * 1024 * 1024,
  },
});

/**
 * Wrap a raw multer middleware so that a LIMIT_FILE_SIZE error becomes a
 * clear 400 JSON response instead of falling through to the generic handler.
 */
function handleMulterUpload(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        // Multer file-size rejection
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "Image size exceeded. Please upload an image of 3 MB or less.",
          });
        }
        // Other multer / fileFilter errors
        if (err.name === "MulterError" || err instanceof Error) {
          return res.status(400).json({ message: err.message });
        }
        return next(err);
      }
      next();
    });
  };
}

/** Attach 100KB image optimization after every multer handler (skips PDF/CSV). */
function withImageOptimization(multerMiddleware) {
  return [handleMulterUpload(multerMiddleware), optimizeUploadedImages];
}

const upload = {
  single: (fieldName) => withImageOptimization(multerUpload.single(fieldName)),
  array: (fieldName, maxCount) =>
    withImageOptimization(multerUpload.array(fieldName, maxCount)),
  fields: (fields) => withImageOptimization(multerUpload.fields(fields)),
};

export default upload;
