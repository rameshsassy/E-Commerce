import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  getAllSellers,
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingKYC,
  approveKYC,
  rejectKYC,
  getPendingProducts,
  approveProduct,
  rejectProduct,
} from "../controllers/admin.controller.js";

const router = express.Router();

// ===============================
// 👥 SELLER MANAGEMENT
// ===============================
router.get("/sellers", protect, authorizeRoles("admin"), getAllSellers);
router.get("/pending-sellers", protect, authorizeRoles("admin"), getPendingSellers);
router.put("/approve/:id", protect, authorizeRoles("admin"), approveSeller);
router.put("/reject/:id", protect, authorizeRoles("admin"), rejectSeller);

// ===============================
// 📄 KYC MANAGEMENT
// ===============================
router.get("/kyc", protect, authorizeRoles("admin"), getPendingKYC);
router.put("/kyc/approve/:id", protect, authorizeRoles("admin"), approveKYC);
router.put("/kyc/reject/:id", protect, authorizeRoles("admin"), rejectKYC);

// ===============================
// 📦 PRODUCT MANAGEMENT
// ===============================
router.get("/pending-products", protect, authorizeRoles("admin"), getPendingProducts);
router.put("/product/approve/:id", protect, authorizeRoles("admin"), approveProduct);
router.put("/product/reject/:id", protect, authorizeRoles("admin"), rejectProduct);

export default router;