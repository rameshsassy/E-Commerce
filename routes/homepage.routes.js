import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../middleware/adminAccess.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  getSettings,
  updateSettings,
  uploadLogo,
  uploadHeroImage,
  getHeaderCategories,
  getAllHeaderCategories,
  createHeaderCategory,
  updateHeaderCategory,
  deleteHeaderCategory,
  reorderHeaderCategories,
} from "../controllers/homepage.controller.js";

const router = express.Router();

// ===============================
// ⚙️ PUBLIC ENDPOINTS
// ===============================
router.get("/", getSettings);
router.get("/categories", getHeaderCategories);

// ===============================
// 🛡️ SUPER ADMIN PROTECTED ENDPOINTS
// ===============================
router.put("/", protect, authorizeSuperAdmin, updateSettings);
router.post("/logo", protect, authorizeSuperAdmin, upload.single("logo"), uploadLogo);
router.post("/hero-image", protect, authorizeSuperAdmin, upload.single("heroImage"), uploadHeroImage);
router.get("/categories/all", protect, authorizeSuperAdmin, getAllHeaderCategories);
router.post("/categories", protect, authorizeSuperAdmin, createHeaderCategory);
router.put("/categories/reorder", protect, authorizeSuperAdmin, reorderHeaderCategories);
router.put("/categories/:id", protect, authorizeSuperAdmin, updateHeaderCategory);
router.delete("/categories/:id", protect, authorizeSuperAdmin, deleteHeaderCategory);

export default router;
