import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import upload from "../middleware/upload.middleware.js";
import { submitKYC } from "../controllers/seller.controller.js";
import {
  getDashboard,
  getSellerProfile,
  updateSellerProfile,
  getSellerProducts,
} from "../controllers/seller.controller.js";

const router = express.Router();

// 📊 Dashboard
router.get("/dashboard", protect, authorizeRoles("seller"), getDashboard);

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

export default router;