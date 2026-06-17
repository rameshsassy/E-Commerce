import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeAdminRole } from "../middleware/adminAccess.middleware.js";
import {
  getPublicFAQs,
  submitFAQRequest,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  getAllFAQRequests,
  answerFAQRequest,
  rejectFAQRequest,
  deleteFAQRequest,
} from "../controllers/faq.controller.js";

const router = express.Router();

// ─── Public (no auth) ─────────────────────────────────────────────────────────
router.get("/", getPublicFAQs);
router.post("/request", submitFAQRequest);

// ─── Admin (protected) ───────────────────────────────────────────────────────
router.get("/admin/all", protect, authorizeAdminRole, getAllFAQs);
router.post("/admin", protect, authorizeAdminRole, createFAQ);
router.put("/admin/:id", protect, authorizeAdminRole, updateFAQ);
router.delete("/admin/:id", protect, authorizeAdminRole, deleteFAQ);

router.get("/admin/requests", protect, authorizeAdminRole, getAllFAQRequests);
router.put("/admin/requests/:id/answer", protect, authorizeAdminRole, answerFAQRequest);
router.put("/admin/requests/:id/reject", protect, authorizeAdminRole, rejectFAQRequest);
router.delete("/admin/requests/:id", protect, authorizeAdminRole, deleteFAQRequest);

export default router;
