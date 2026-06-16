import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../middleware/adminAccess.middleware.js";

import {
  validateImportFile,
  importCustomers,
  importSellers,
  importProducts,
  importOrders,
  getImportHistory,
  getImportReport,
  downloadErrorReport,
  downloadTemplate,
} from "../controllers/import.controller.js";

const router = express.Router();

// ─── Ensure upload directory exists ──────────────────────────────────────────
const IMPORT_UPLOAD_DIR = "uploads/imports";
if (!fs.existsSync(IMPORT_UPLOAD_DIR)) {
  fs.mkdirSync(IMPORT_UPLOAD_DIR, { recursive: true });
}

// ─── Multer configuration: accept CSV & XLSX ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMPORT_UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `import-${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || [".csv", ".xlsx", ".xls"].includes(ext)) {
    return cb(null, true);
  }
  cb(new Error("Only CSV and Excel files are allowed."), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ─── All routes: Super Admin only (role === "admin") ──────────────────────────

// Validate file (dry-run)
router.post("/validate", protect, authorizeSuperAdmin, upload.single("file"), validateImportFile);

// Import endpoints
router.post("/customers", protect, authorizeSuperAdmin, upload.single("file"), importCustomers);
router.post("/sellers",   protect, authorizeSuperAdmin, upload.single("file"), importSellers);
router.post("/products",  protect, authorizeSuperAdmin, upload.single("file"), importProducts);
router.post("/orders",    protect, authorizeSuperAdmin, upload.single("file"), importOrders);

// History & Reports
router.get("/history",              protect, authorizeSuperAdmin, getImportHistory);
router.get("/report/:id",           protect, authorizeSuperAdmin, getImportReport);
router.get("/report/:id/download",  protect, authorizeSuperAdmin, downloadErrorReport);

// Sample template download
router.get("/template/:type", protect, authorizeSuperAdmin, downloadTemplate);

export default router;
