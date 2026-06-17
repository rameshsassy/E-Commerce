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
  changeSellerPassword,
  getSellerProducts,
  getProductInventoryOptions,
  getProductDraft,
  submitKycStep1,
  submitKycStep2,
  submitKycComplete,
  finalizeKyc,
  getKycDocumentUrl,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  upgradeSellerToPremiumManual,
  getPremiumPageDetails,
  getReferAndEarn,
  sendReferralInvite,
  getAboutUs,
  getRecentActivity,
  setSubscriptionDaysForTest,
  triggerRemindersForTest,
  triggerReferralFollowUpsForTest,
} from "../controllers/seller.controller.js";
import {
  listSellerBulkInquiries,
  getSellerBulkInquiryDetail,
  updateBulkInquiryStatus,
} from "../controllers/bulkInquiry.controller.js";
import {
  getMyStore,
  createStore,
  updateStore,
  checkSubdomainAvailability,
} from "../controllers/store.controller.js";
import {
  getSellerStoreConfig,
  updateSellerStoreConfig,
} from "../controllers/storeConfig.controller.js";
import { listSellerKycEntityTypes } from "../controllers/kycEntityType.controller.js";
import {
  getBuyProducts,
  placeSellerOrder
} from "../controllers/sellerBuy.controller.js";

const router = express.Router();

const kycImageUpload = upload.array("documents", 2);
const kycLogoUpload = upload.single("logo");
const kycDocsUpload = upload.fields([
  { name: "registrationCertificate", maxCount: 1 },
  { name: "orgPanImage", maxCount: 1 },
  { name: "cancelledCheckImage", maxCount: 1 },
  { name: "gstImage", maxCount: 1 },
]);

const kycCompleteUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "registrationCertificate", maxCount: 1 },
  { name: "orgPanImage", maxCount: 1 },
  { name: "cancelledCheckImage", maxCount: 1 },
  { name: "gstImage", maxCount: 1 },
]);

// 📊 Dashboard
router.get("/dashboard", protect, authorizeRoles("seller"), getDashboard);
router.get("/recent-activity", protect, authorizeRoles("seller"), getRecentActivity);
router.get("/analytics", protect, authorizeRoles("seller"), getAnalytics);
router.get("/refer-and-earn", protect, authorizeRoles("seller"), getReferAndEarn);
router.post("/refer-and-earn/invite", protect, authorizeRoles("seller"), sendReferralInvite);
router.get("/about-us", protect, authorizeRoles("seller"), getAboutUs);
router.get("/bulk-inquiries", protect, authorizeRoles("seller"), listSellerBulkInquiries);
router.get("/bulk-inquiries/:id", protect, authorizeRoles("seller"), getSellerBulkInquiryDetail);
router.patch("/bulk-inquiries/:id", protect, authorizeRoles("seller"), updateBulkInquiryStatus);

// 👤 Profile
router.get("/profile", protect, authorizeRoles("seller"), getSellerProfile);
router.put("/profile", protect, authorizeRoles("seller"), updateSellerProfile);
router.patch("/profile", protect, authorizeRoles("seller"), updateSellerProfile);
router.post("/profile/change-password", protect, authorizeRoles("seller"), changeSellerPassword);

const storeAssetsUpload = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "favicon", maxCount: 1 },
]);

// 🏪 Seller store (My Store)
router.get("/store", protect, authorizeRoles("seller"), getMyStore);
router.post("/store", protect, authorizeRoles("seller"), ...storeAssetsUpload, createStore);
router.put("/store", protect, authorizeRoles("seller"), ...storeAssetsUpload, updateStore);
router.patch("/store", protect, authorizeRoles("seller"), ...storeAssetsUpload, updateStore);
router.get(
  "/store/subdomain-check",
  protect,
  authorizeRoles("seller"),
  checkSubdomainAvailability
);
router.get("/store-config", protect, authorizeRoles("seller"), getSellerStoreConfig);
router.put("/store-config", protect, authorizeRoles("seller"), updateSellerStoreConfig);

// 📦 Products
router.get("/products", protect, authorizeRoles("seller"), getSellerProducts);
router.get(
  "/products/inventory-options",
  protect,
  authorizeRoles("seller"),
  getProductInventoryOptions
);
router.get("/products/draft", protect, authorizeRoles("seller"), getProductDraft);

router.get("/kyc/entity-types", protect, authorizeRoles("seller"), listSellerKycEntityTypes);
router.get("/kyc/document/:field", protect, authorizeRoles("seller"), getKycDocumentUrl);

// 📄 KYC Upload
router.post("/kyc", protect, authorizeRoles("seller"), ...kycImageUpload, submitKYC);

router.post("/kyc/step1", protect, authorizeRoles("seller"), ...kycLogoUpload, submitKycStep1);

router.patch("/kyc/step1", protect, authorizeRoles("seller"), ...kycLogoUpload, submitKycStep1);

router.post("/kyc/step2", protect, authorizeRoles("seller"), ...kycDocsUpload, submitKycStep2);

router.patch("/kyc/step2", protect, authorizeRoles("seller"), ...kycDocsUpload, submitKycStep2);

router.post(
  "/kyc/submit",
  protect,
  authorizeRoles("seller"),
  finalizeKyc
);

router.post(
  "/kyc/complete",
  protect,
  authorizeRoles("seller"),
  ...kycCompleteUpload,
  submitKycComplete
);

router.patch(
  "/kyc/complete",
  protect,
  authorizeRoles("seller"),
  ...kycCompleteUpload,
  submitKycComplete
);

// 💎 Subscription Flow
import { validateSellerUpgradeVoucher } from "../controllers/voucherUsage.controller.js";
router.post("/vouchers/validate-upgrade", protect, authorizeRoles("seller"), validateSellerUpgradeVoucher);
router.post("/subscription/razorpay", protect, authorizeRoles("seller"), createSubscriptionOrder);
router.post("/subscription/razorpay/verify", protect, authorizeRoles("seller"), verifySubscriptionPayment);
router.post("/upgrade", protect, authorizeRoles("seller"), upgradeSellerToPremiumManual);
router.get("/premium/details", protect, authorizeRoles("seller"), getPremiumPageDetails);
router.post("/test/set-subscription", protect, authorizeRoles("seller"), setSubscriptionDaysForTest);
router.post("/test/run-reminders", protect, authorizeRoles("seller"), triggerRemindersForTest);
router.post("/test/run-referral-followups", protect, authorizeRoles("seller"), triggerReferralFollowUpsForTest);

import {
  createVoucher,
  getSellerVouchers,
  deleteVoucher
} from "../controllers/voucher.controller.js";

// 🛍️ Seller Buy Products Flow
router.get("/buy-products", protect, authorizeRoles("seller"), getBuyProducts);
router.post("/buy-products/order", protect, authorizeRoles("seller"), placeSellerOrder);

// 🏷️ Seller Vouchers
router.get("/vouchers", protect, authorizeRoles("seller"), getSellerVouchers);
router.post("/vouchers", protect, authorizeRoles("seller"), createVoucher);
router.delete("/vouchers/:id", protect, authorizeRoles("seller"), deleteVoucher);

export default router;
