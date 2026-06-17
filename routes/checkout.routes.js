import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { verifyBuyNow } from "../controllers/order.controller.js";

const router = express.Router();

router.post("/buy-now", protect, authorizeRoles("customer"), verifyBuyNow);

export default router;
