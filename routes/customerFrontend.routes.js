/**
 * Convenience routes for the Loveable customer frontend.
 *
 * The frontend calls /api/wishlist, /api/cart (flat paths)
 * whereas the existing backend mounts them under /api/customer/*.
 * These routes alias the same controllers so both paths work.
 */
import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

import {
  getWishlist,
  toggleWishlist,
} from "../controllers/wishlist.controller.js";
import { removeFromWishlist } from "../controllers/wishlistRemove.controller.js";

import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";

// ===============================
// ✅ WISHLIST (alias routes)
// ===============================
const wishlistRouter = express.Router();

wishlistRouter.get("/", protect, authorizeRoles("customer"), getWishlist);
wishlistRouter.post("/", protect, authorizeRoles("customer"), toggleWishlist);
wishlistRouter.delete("/:productId", protect, authorizeRoles("customer"), removeFromWishlist);

// ===============================
// ✅ CART (alias routes)
// ===============================
const cartRouter = express.Router();

cartRouter.get("/", protect, authorizeRoles("customer"), getCart);
cartRouter.post("/", protect, authorizeRoles("customer"), addToCart);
cartRouter.put("/:productId", protect, authorizeRoles("customer"), updateCartItem);
cartRouter.delete("/:productId", protect, authorizeRoles("customer"), removeFromCart);
cartRouter.delete("/", protect, authorizeRoles("customer"), clearCart);

export { wishlistRouter, cartRouter };
