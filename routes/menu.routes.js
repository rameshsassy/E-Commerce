import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  authorizeAdminRole,
  requireAdminSection,
} from "../middleware/adminAccess.middleware.js";

import {
  getMenuItems,
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller.js";

const router = express.Router();

// Public route to fetch active menu items
router.get("/", getMenuItems);

// Admin-protected routes
router.get("/all", protect, authorizeAdminRole, requireAdminSection("categories"), getAllMenuItems);
router.post("/", protect, authorizeAdminRole, requireAdminSection("categories"), createMenuItem);
router.put("/:id", protect, authorizeAdminRole, requireAdminSection("categories"), updateMenuItem);
router.delete("/:id", protect, authorizeAdminRole, requireAdminSection("categories"), deleteMenuItem);

export default router;
