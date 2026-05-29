import express from 'express';
import {
  getShipmentsByOrder,
  listSellerShipments,
  getSellerShipmentDetail,
  trackShipment,
  updateShipmentStatus,
} from '../controllers/shipment.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { allowSellerOrAdminForShipments } from '../middleware/adminAccess.middleware.js';

const router = express.Router();

// Customer Routes
router.get('/customer/order/:orderId', protect, getShipmentsByOrder);
router.get('/customer/track/:shipmentId', protect, trackShipment);

// Seller/Admin Routes
router.get('/seller', protect, allowSellerOrAdminForShipments, listSellerShipments);
router.get('/seller/:shipmentId', protect, allowSellerOrAdminForShipments, getSellerShipmentDetail);
router.put('/seller/:shipmentId/status', protect, allowSellerOrAdminForShipments, updateShipmentStatus);

export default router;
