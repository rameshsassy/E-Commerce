import express from "express";
import { getPublicFeaturedProducts } from "../controllers/featuredProductLayout.controller.js";

const router = express.Router();

// ─── Public Routes ───────────────────────────────────────────────────────────
router.get("/featured-products", getPublicFeaturedProducts);

export default router;
