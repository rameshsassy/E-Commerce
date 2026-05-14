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
  checkPincode,
} from "../controllers/product.controller.js";
import { createBulkInquiry } from "../controllers/bulkInquiry.controller.js";

import {
  createProductReview,
  getProductReviews,
  markReviewHelpful
} from "../controllers/review.controller.js";

const router = express.Router();

// ===============================
// 📦 PUBLIC ROUTES
// ===============================

// Get all approved products (with search, filter, pagination)
router.get("/", getAllProducts);

// Get single approved product by ID
router.get("/:id", getProductById);

// Check if a product is deliverable to a pincode
router.get("/:id/check-pincode", checkPincode);

// Bulk order inquiry (Premium sellers only — enforced in controller)
router.post("/:id/bulk-inquiry", createBulkInquiry);

// ===============================
// ⭐ PRODUCT REVIEWS
// ===============================
router.post("/:id/reviews", protect, authorizeRoles("customer"), upload.array("images", 3), createProductReview);
router.get("/:id/reviews", getProductReviews);
router.put("/:id/reviews/:reviewId/helpful", protect, markReviewHelpful);

// ===============================
// ➕ SELLER PRODUCT UPLOAD
// ===============================

// Single product upload
router.post(
  "/",
  protect,
  authorizeRoles("seller"),
  upload.array("images", 5), // limited to 5 images
  addProduct
);

// Update product
router.put(
  "/:id",
  protect,
  authorizeRoles("seller"),
  upload.array("images", 5),
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