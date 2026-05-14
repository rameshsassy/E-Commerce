import express from 'express';
import { applyCoupon, createCoupon } from '../controllers/coupon.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorizeAdminRole, requireAdminSection } from '../middleware/adminAccess.middleware.js';

const router = express.Router();

router.post('/customer/apply', protect, applyCoupon);
router.post('/admin', protect, authorizeAdminRole, requireAdminSection('coupons'), createCoupon);

export default router;
