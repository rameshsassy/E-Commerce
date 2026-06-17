import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { checkReviewEligibility, submitReview } from "../controllers/review.controller.js";

const router = express.Router();

router.get("/eligibility/:productId", protect, authorizeRoles("customer"), checkReviewEligibility);
router.post("/", protect, authorizeRoles("customer"), submitReview);

export default router;
