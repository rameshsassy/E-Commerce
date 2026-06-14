import express from "express";
import {
  getCustomerProfile,
  updateCustomerEmailPreferences,
} from "../controllers/customer.controller.js";

import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";

import {
  getWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller.js";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

import {
  createOrder,
  getOrderById,
  getMyOrders,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from "../controllers/order.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

// ===============================
// ✅ CUSTOMER PROFILE
// ===============================
router.get("/profile", protect, authorizeRoles("customer"), getCustomerProfile);
router.put(
  "/email-preferences",
  protect,
  authorizeRoles("customer"),
  updateCustomerEmailPreferences
);

// ===============================
// ✅ ADDRESSES
// ===============================
router.post("/address", protect, authorizeRoles("customer"), addAddress);
router.get("/address", protect, authorizeRoles("customer"), getAddresses);
router.put("/address/:id", protect, authorizeRoles("customer"), updateAddress);
router.delete("/address/:id", protect, authorizeRoles("customer"), deleteAddress);

// ===============================
// ✅ WISHLIST
// ===============================
router.get("/wishlist", protect, authorizeRoles("customer"), getWishlist);
router.post("/wishlist/toggle", protect, authorizeRoles("customer"), toggleWishlist);

// ===============================
// ✅ CART
// ===============================
router.get("/cart", protect, authorizeRoles("customer"), getCart);
router.post("/cart", protect, authorizeRoles("customer"), addToCart);
router.put("/cart/:productId", protect, authorizeRoles("customer"), updateCartItem);
router.delete("/cart/:productId", protect, authorizeRoles("customer"), removeFromCart);
router.delete("/cart", protect, authorizeRoles("customer"), clearCart);

// ===============================
// ✅ ORDERS & PAYMENTS
// ===============================
router.post("/order", protect, authorizeRoles("customer"), createOrder);
router.get("/orders", protect, authorizeRoles("customer"), getMyOrders);
router.get("/order/:id", protect, authorizeRoles("customer"), getOrderById);
router.get("/orders/:id", protect, authorizeRoles("customer"), getOrderById); // alias for frontend

router.post("/order/razorpay", protect, authorizeRoles("customer"), createRazorpayOrder);
router.post("/order/razorpay/verify", protect, authorizeRoles("customer"), verifyRazorpayPayment);

export default router;