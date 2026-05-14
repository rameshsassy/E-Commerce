import express from "express";

import {
  registerSeller,
  registerCustomer,
  loginUser,
  createAdmin,
  forgotPassword,
  resetPassword,
  refreshTokenHandler,
  logoutUser,
} from "../controllers/auth.controller.js";

const router = express.Router();

// ===============================
// 🔐 AUTH ROUTES
// ===============================
router.post("/seller/register", registerSeller);
router.post("/customer/register", registerCustomer);
router.post("/admin/register", createAdmin);
router.post("/login", loginUser);
router.post("/refresh-token", refreshTokenHandler);
router.post("/logout", logoutUser);

// ===============================
// 🔑 PASSWORD RESET ROUTES
// ===============================
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;