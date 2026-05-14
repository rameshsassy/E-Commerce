import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  authorizeAdminRole,
  requireAdminSection,
} from "../middleware/adminAccess.middleware.js";

import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
} from "../controllers/category.controller.js";

const router = express.Router();

// Public Routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin Routes
router.post("/", protect, authorizeAdminRole, requireAdminSection("categories"), createCategory);
router.put("/:id", protect, authorizeAdminRole, requireAdminSection("categories"), updateCategory);
router.delete("/:id", protect, authorizeAdminRole, requireAdminSection("categories"), deleteCategory);

export default router;
