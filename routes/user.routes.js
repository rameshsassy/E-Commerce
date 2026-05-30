import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getProfile, updateProfile } from "../controllers/user.controller.js";

const router = express.Router();

// 👤 Common Profile Routes
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.patch("/profile", protect, updateProfile);

export default router;