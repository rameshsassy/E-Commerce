import express from 'express';
import { getShipmentsByOrder, trackShipment, updateShipmentStatus } from '../controllers/shipment.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Customer Routes
router.get('/customer/order/:orderId', protect, getShipmentsByOrder);
router.get('/customer/track/:shipmentId', protect, trackShipment);

// Seller/Admin Routes
router.put('/seller/:shipmentId/status', protect, authorizeRoles('seller', 'admin'), updateShipmentStatus);

export default router;
