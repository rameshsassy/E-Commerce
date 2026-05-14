import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { submitKYC } from "../controllers/seller.controller.js";
import {
  getDashboard,
  getAnalytics,
  getSellerProfile,
  updateSellerProfile,
  getSellerProducts,
  submitKycStep1,
  submitKycStep2,
  finalizeKyc,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  upgradeSellerToPremiumManual,
} from "../controllers/seller.controller.js";
import {
  listSellerBulkInquiries,
  updateBulkInquiryStatus,
} from "../controllers/bulkInquiry.controller.js";

const router = express.Router();

// 📊 Dashboard
router.get("/dashboard", protect, authorizeRoles("seller"), getDashboard);
router.get("/analytics", protect, authorizeRoles("seller"), getAnalytics);
router.get("/bulk-inquiries", protect, authorizeRoles("seller"), listSellerBulkInquiries);
router.patch("/bulk-inquiries/:id", protect, authorizeRoles("seller"), updateBulkInquiryStatus);

// 👤 Profile
router.get("/profile", protect, authorizeRoles("seller"), getSellerProfile);
router.put("/profile", protect, authorizeRoles("seller"), updateSellerProfile);

// 📦 Products
router.get("/products", protect, authorizeRoles("seller"), getSellerProducts);

// 📄 KYC Upload
router.post(
    "/kyc",
    protect,
    authorizeRoles("seller"),
    upload.array("documents", 2),
    submitKYC
    );

// 📄 KYC Step 1 (Organization Details)
router.post(
    "/kyc/step1",
    protect,
    authorizeRoles("seller"),
    upload.single("logo"),
    submitKycStep1
);

// 📄 KYC Step 2 (Business Documents)
router.post(
    "/kyc/step2",
    protect,
    authorizeRoles("seller"),
    upload.fields([
      { name: "registrationCertificate", maxCount: 1 },
      { name: "orgPanImage", maxCount: 1 },
      { name: "cancelledCheckImage", maxCount: 1 },
      { name: "gstImage", maxCount: 1 },
    ]),
    submitKycStep2
);

// ✅ Submit KYC for Verification
router.post(
    "/kyc/submit",
    protect,
    authorizeRoles("seller"),
    finalizeKyc
);

// 💎 Subscription Flow
router.post("/subscription/razorpay", protect, authorizeRoles("seller"), createSubscriptionOrder);
router.post("/subscription/razorpay/verify", protect, authorizeRoles("seller"), verifySubscriptionPayment);
router.post("/upgrade", protect, authorizeRoles("seller"), upgradeSellerToPremiumManual);

export default router;