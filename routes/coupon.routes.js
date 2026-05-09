import express from 'express';
import { applyCoupon, createCoupon } from '../controllers/coupon.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/customer/apply', protect, applyCoupon);
router.post('/admin', protect, authorizeRoles('admin'), createCoupon);

export default router;
