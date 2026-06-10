import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { createWebsiteRequest } from "../controllers/websiteRequest.controller.js";

const router = express.Router();

// POST /api/website-requests - Seller submits website request
router.post("/", protect, authorizeRoles("seller"), createWebsiteRequest);

export default router;
