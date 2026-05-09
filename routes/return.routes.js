import express from 'express';
import { createReturnRequest, getMyReturns, updateReturnStatus } from '../controllers/return.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Customer Routes
router.post('/customer', protect, createReturnRequest);
router.get('/customer', protect, getMyReturns);

// Seller/Admin Routes
router.put('/seller/:returnId/status', protect, authorizeRoles('seller', 'admin'), updateReturnStatus);

export default router;
