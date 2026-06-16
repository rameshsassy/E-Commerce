import express from "express";
import { protect, authorizeRoles } from "../middleware/auth.middleware.js";
import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  listCustomerRewards,
  getCustomerRewardDetail,
  adjustCustomerReward,
  listTransactions,
  getReports,
  getSettings,
  updateSettings,
} from "../controllers/adminRewards.controller.js";

const router = express.Router();

// All admin reward routes require authentication + admin role
router.use(protect, authorizeRoles("admin", "admin_staff"));

// Campaigns
router.get("/campaigns", listCampaigns);
router.get("/campaigns/:id", getCampaign);
router.post("/campaigns", authorizeRoles("admin"), createCampaign);
router.put("/campaigns/:id", authorizeRoles("admin"), updateCampaign);
router.delete("/campaigns/:id", authorizeRoles("admin"), deleteCampaign);

// Customer rewards management
router.get("/customers", listCustomerRewards);
router.get("/customers/:customerId", getCustomerRewardDetail);
router.put("/customers/:customerId/adjust", authorizeRoles("admin"), adjustCustomerReward);

// Transactions & Reports
router.get("/transactions", listTransactions);
router.get("/reports", getReports);

// Settings
router.get("/settings", getSettings);
router.put("/settings", authorizeRoles("admin"), updateSettings);

export default router;
