import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  authorizeSuperAdmin,
  authorizeAdminRole,
  requireAdminSection,
} from "../middleware/adminAccess.middleware.js";
import {
  getAdminVouchers,
  getVoucherSearchData,
  createAdminVoucher,
  deleteAdminVoucher,
} from "../controllers/adminVoucher.controller.js";

import {
  getAllSellers,
  getAllCustomers,
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
  sendWeeklyRecapAction,
  signupAdmin,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
} from "../controllers/admin.controller.js";
import { adminSignupRateLimiter } from "../middleware/rateLimit.middleware.js";
import {
  listAdminBulkInquiries,
  updateBulkInquiryStatus,
} from "../controllers/bulkInquiry.controller.js";
import { getEmailLogs } from "../controllers/emailLog.controller.js";
import {
  listAdminKycEntityTypes,
  createKycEntityType,
  updateKycEntityType,
  deleteKycEntityType,
} from "../controllers/kycEntityType.controller.js";
import {
  getAllWebsiteRequests,
  updateWebsiteRequestStatus,
  deleteWebsiteRequest,
} from "../controllers/websiteRequest.controller.js";

const router = express.Router();

// ===============================
// 🔑 PUBLIC SIGNUP
// ===============================
router.post("/signup", adminSignupRateLimiter, signupAdmin);

// ===============================
// 👥 SELLER & CUSTOMER MANAGEMENT
// ===============================
router.get("/sellers", protect, authorizeAdminRole, requireAdminSection("sellers"), getAllSellers);
router.get("/customers", protect, authorizeAdminRole, requireAdminSection("sellers"), getAllCustomers);
router.get("/pending-sellers", protect, authorizeAdminRole, requireAdminSection("sellers"), getPendingSellers);
router.put("/approve/:id", protect, authorizeAdminRole, requireAdminSection("sellers"), approveSeller);
router.put("/reject/:id", protect, authorizeAdminRole, requireAdminSection("sellers"), rejectSeller);
router.post("/sellers/:id/send-weekly-recap", protect, authorizeAdminRole, requireAdminSection("sellers"), sendWeeklyRecapAction);

// ===============================
// 📄 KYC MANAGEMENT
// ===============================
router.get("/kyc", protect, authorizeAdminRole, requireAdminSection("kyc"), getPendingKYC);
router.put("/kyc/approve/:id", protect, authorizeAdminRole, requireAdminSection("kyc"), approveKYC);
router.put("/kyc/reject/:id", protect, authorizeAdminRole, requireAdminSection("kyc"), rejectKYC);

router.get(
  "/kyc-entity-types",
  protect,
  authorizeAdminRole,
  requireAdminSection("kyc"),
  listAdminKycEntityTypes
);
router.post(
  "/kyc-entity-types",
  protect,
  authorizeAdminRole,
  requireAdminSection("kyc"),
  createKycEntityType
);
router.patch(
  "/kyc-entity-types/:id",
  protect,
  authorizeAdminRole,
  requireAdminSection("kyc"),
  updateKycEntityType
);
router.delete(
  "/kyc-entity-types/:id",
  protect,
  authorizeAdminRole,
  requireAdminSection("kyc"),
  deleteKycEntityType
);

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

// ===============================
// 🌐 WEBSITE REQUESTS MANAGEMENT
// ===============================
router.get("/website-requests", protect, authorizeAdminRole, getAllWebsiteRequests);
router.put("/website-requests/:id/status", protect, authorizeAdminRole, updateWebsiteRequestStatus);
router.delete("/website-requests/:id", protect, authorizeAdminRole, deleteWebsiteRequest);

// ===============================
// 🎟️ ADMIN VOUCHERS
// ===============================
router.get("/vouchers", protect, authorizeAdminRole, requireAdminSection("coupons"), getAdminVouchers);
router.get("/vouchers/search-data", protect, authorizeAdminRole, requireAdminSection("coupons"), getVoucherSearchData);
router.post("/vouchers", protect, authorizeAdminRole, requireAdminSection("coupons"), createAdminVoucher);
router.delete("/vouchers/:id", protect, authorizeAdminRole, requireAdminSection("coupons"), deleteAdminVoucher);

// ===============================
// 👤 ADMIN MY PROFILE
// ===============================
router.get("/profile", protect, authorizeAdminRole, getAdminProfile);
router.put("/profile", protect, authorizeAdminRole, updateAdminProfile);
router.post("/profile/change-password", protect, authorizeAdminRole, changeAdminPassword);

export default router;
