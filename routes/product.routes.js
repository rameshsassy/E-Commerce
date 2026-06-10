import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";

import {
  addProduct,
  getAllProducts,
  getCategoryPageSeo,
  bulkUploadProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  checkPincode,
  autoSaveProduct,
  getDeliverySuggestions,
  getDeliveryOptions,
  updateProductActiveStatus,
  downloadBulkUploadTemplate,
} from "../controllers/product.controller.js";
import { createBulkInquiry } from "../controllers/bulkInquiry.controller.js";

import {
  createProductReview,
  getProductReviews,
  markReviewHelpful
} from "../controllers/review.controller.js";
import { renameUploadedProductImages } from "../middleware/renameProductImages.middleware.js";
import { uploadProductImagesToGoogleDrive } from "../middleware/googleDrive.middleware.js";

const router = express.Router();

const sellerImageUpload = upload.fields([
  { name: "images", maxCount: 5 },
  { name: "variantImages", maxCount: 30 },
]);

// ===============================
// 📦 PUBLIC ROUTES
// ===============================

router.get("/category-seo", getCategoryPageSeo);
router.get("/", getAllProducts);

router.get("/shipping/delivery-options", getDeliveryOptions);
router.get("/shipping/suggestions", getDeliverySuggestions);

// Bulk CSV (must be before /:id)
router.get(
  "/bulk/template",
  protect,
  authorizeRoles("seller"),
  downloadBulkUploadTemplate
);

router.post(
  "/bulk",
  protect,
  authorizeRoles("seller"),
  ...upload.single("file"),
  bulkUploadProducts
);

router.get("/:id/check-pincode", checkPincode);

router.get("/:id", getProductById);

router.post("/:id/bulk-inquiry", createBulkInquiry);

// ===============================
// ⭐ PRODUCT REVIEWS
// ===============================
router.post(
  "/:id/reviews",
  protect,
  authorizeRoles("customer"),
  ...upload.array("images", 3),
  createProductReview
);
router.get("/:id/reviews", getProductReviews);
router.put("/:id/reviews/:reviewId/helpful", protect, markReviewHelpful);

// ===============================
// 💾 SELLER AUTO-SAVE (before :id CRUD)
// ===============================
router.patch(
  "/autosave",
  protect,
  authorizeRoles("seller"),
  ...sellerImageUpload,
  renameUploadedProductImages,
  uploadProductImagesToGoogleDrive,
  autoSaveProduct
);

router.patch(
  "/:id/autosave",
  protect,
  authorizeRoles("seller"),
  ...sellerImageUpload,
  renameUploadedProductImages,
  uploadProductImagesToGoogleDrive,
  autoSaveProduct
);

// ===============================
// ➕ SELLER PRODUCT UPLOAD
// ===============================
router.post(
  "/",
  protect,
  authorizeRoles("seller"),
  ...sellerImageUpload,
  renameUploadedProductImages,
  uploadProductImagesToGoogleDrive,
  addProduct
);

router.put(
  "/:id",
  protect,
  authorizeRoles("seller"),
  ...sellerImageUpload,
  renameUploadedProductImages,
  uploadProductImagesToGoogleDrive,
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("seller"),
  deleteProduct
);

router.patch(
  "/:id/active",
  protect,
  authorizeRoles("seller"),
  updateProductActiveStatus
);

export default router;
