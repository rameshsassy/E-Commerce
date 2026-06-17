import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { createBulkPurchaseRequest } from "../controllers/bulkPurchase.controller.js";

const router = express.Router();

router.post("/request", protect, authorizeRoles("customer"), createBulkPurchaseRequest);

export default router;
