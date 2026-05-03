import express from "express";
import {
  getCustomerProfile,
} from "../controllers/customer.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// Get customer profile
router.get(
  "/profile",
  protect,
  authorizeRoles("customer"),
  getCustomerProfile
);

export default router;