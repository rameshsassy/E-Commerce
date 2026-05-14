import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  authorizeSuperAdmin,
  authorizeAdminRole,
  requireAdminSection,
} from "../middleware/adminAccess.middleware.js";

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
  getAnalytics,
  getAllOrders,
  getAllReturns,
  getAllCoupons,
  listAdminStaff,
  createAdminStaff,
  updateAdminStaff,
  deleteAdminStaff,
} from "../controllers/admin.controller.js";
import {
  listAdminBulkInquiries,
  updateBulkInquiryStatus,
} from "../controllers/bulkInquiry.controller.js";
import { getEmailLogs } from "../controllers/emailLog.controller.js";

const router = express.Router();

// ===============================
// 👥 SELLER MANAGEMENT
// ===============================
router.get("/sellers", protect, authorizeAdminRole, requireAdminSection("sellers"), getAllSellers);
router.get("/pending-sellers", protect, authorizeAdminRole, requireAdminSection("sellers"), getPendingSellers);
router.put("/approve/:id", protect, authorizeAdminRole, requireAdminSection("sellers"), approveSeller);
router.put("/reject/:id", protect, authorizeAdminRole, requireAdminSection("sellers"), rejectSeller);

// ===============================
// 📄 KYC MANAGEMENT
// ===============================
router.get("/kyc", protect, authorizeAdminRole, requireAdminSection("kyc"), getPendingKYC);
router.put("/kyc/approve/:id", protect, authorizeAdminRole, requireAdminSection("kyc"), approveKYC);
router.put("/kyc/reject/:id", protect, authorizeAdminRole, requireAdminSection("kyc"), rejectKYC);

// ===============================
// 📦 PRODUCT MANAGEMENT
// ===============================
router.get("/pending-products", protect, authorizeAdminRole, requireAdminSection("products"), getPendingProducts);
router.put("/product/approve/:id", protect, authorizeAdminRole, requireAdminSection("products"), approveProduct);
router.put("/product/reject/:id", protect, authorizeAdminRole, requireAdminSection("products"), rejectProduct);

// ===============================
// 📊 ANALYTICS & MONITORING
// ===============================
router.get("/analytics", protect, authorizeAdminRole, requireAdminSection("dashboard"), getAnalytics);
router.get("/email-logs", protect, authorizeAdminRole, requireAdminSection("dashboard"), getEmailLogs);
router.get("/bulk-inquiries", protect, authorizeAdminRole, requireAdminSection("dashboard"), listAdminBulkInquiries);
router.patch("/bulk-inquiries/:id", protect, authorizeAdminRole, requireAdminSection("dashboard"), updateBulkInquiryStatus);
router.get("/orders", protect, authorizeAdminRole, requireAdminSection("orders"), getAllOrders);
router.get("/returns", protect, authorizeAdminRole, requireAdminSection("returns"), getAllReturns);
router.get("/coupons", protect, authorizeAdminRole, requireAdminSection("coupons"), getAllCoupons);

// ===============================
// 🔐 ADMIN ROLES (primary admin only)
// ===============================
router.get("/roles/staff", protect, authorizeSuperAdmin, listAdminStaff);
router.post("/roles/staff", protect, authorizeSuperAdmin, createAdminStaff);
router.patch("/roles/staff/:id", protect, authorizeSuperAdmin, updateAdminStaff);
router.delete("/roles/staff/:id", protect, authorizeSuperAdmin, deleteAdminStaff);

export default router;
