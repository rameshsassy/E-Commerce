import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  getMyRewardSummary,
  getMyWallet,
  getMyRewardHistory,
  redeemReward,
} from "../controllers/rewards.controller.js";

const router = express.Router();

// All customer reward routes require authentication + customer role
router.use(protect, authorizeRoles("customer"));

router.get("/me", getMyRewardSummary);
router.get("/wallet", getMyWallet);
router.get("/history", getMyRewardHistory);
router.post("/redeem", redeemReward);

export default router;
