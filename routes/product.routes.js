import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  addProduct,
  getAllProducts,
  bulkUploadProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

const router = express.Router();

// ===============================
// 📦 PUBLIC ROUTES
// ===============================

// Get all approved products (with search, filter, pagination)
router.get("/", getAllProducts);

// Get single approved product by ID
router.get("/:id", getProductById);

// ===============================
// ➕ SELLER PRODUCT UPLOAD
// ===============================

// Single product upload
router.post(
  "/",
  protect,
  authorizeRoles("seller"),
  upload.array("images", 100), // generously high limit acting as unlimited
  addProduct
);

// Update product
router.put(
  "/:id",
  protect,
  authorizeRoles("seller"),
  upload.array("images", 100),
  updateProduct
);

// Delete product
router.delete(
  "/:id",
  protect,
  authorizeRoles("seller"),
  deleteProduct
);

// ===============================
// 📦 BULK PRODUCT UPLOAD (CSV)
// ===============================

router.post(
  "/bulk",
  protect,
  authorizeRoles("seller"),
  upload.single("file"), // CSV file upload
  bulkUploadProducts
);

export default router;