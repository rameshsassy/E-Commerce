import multer from "multer";
import path from "path";
import fs from "fs";

// 🔧 Create folder if not exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 📦 Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = "uploads/products";

    // 👉 If KYC route
    if (req.originalUrl.includes("kyc")) {
      uploadPath = "uploads/kyc";
    }

    ensureDir(uploadPath);
    cb(null, uploadPath);
  },

  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() + "-" + file.fieldname + path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// 🖼️ File filter (images, pdfs, csv)
const fileFilter = (req, file, cb) => {
  const allowed = [
    "image/jpeg", 
    "image/png", 
    "image/jpg",
    "application/pdf", 
    "text/csv"
  ];

  if (allowed.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed: " + file.mimetype), false);
  }
};

// 🚀 Upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export default upload;