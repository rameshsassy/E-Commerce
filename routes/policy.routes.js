import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeSuperAdmin } from "../middleware/adminAccess.middleware.js";
import {
  getPublicPolicies,
  getPublicPolicyByType,
  createPolicy,
  getAllPolicies,
  getSinglePolicy,
  updatePolicy,
  deletePolicy,
  changeStatus,
} from "../controllers/policy.controller.js";

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
router.get("/policies", getPublicPolicies);
router.get("/policies/:type", getPublicPolicyByType);

// ─── Admin Routes (Super Admin Only) ──────────────────────────────────────────
router.post("/admin/policies", protect, authorizeSuperAdmin, createPolicy);
router.get("/admin/policies", protect, authorizeSuperAdmin, getAllPolicies);
router.get("/admin/policies/:id", protect, authorizeSuperAdmin, getSinglePolicy);
router.put("/admin/policies/:id", protect, authorizeSuperAdmin, updatePolicy);
router.delete("/admin/policies/:id", protect, authorizeSuperAdmin, deletePolicy);
router.patch("/admin/policies/:id/status", protect, authorizeSuperAdmin, changeStatus);

export default router;
