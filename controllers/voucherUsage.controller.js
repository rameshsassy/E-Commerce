import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { validateAndCalculateCartVoucher, validateUpgradeVoucher } from "../utils/voucherHelper.js";

/**
 * Validate customer cart voucher and calculate discounts
 * @route POST /api/customer/vouchers/validate
 */
export const validateCustomerVoucher = async (req, res) => {
  try {
    const { voucherCode, productId, quantity, selectedColor, selectedSize, purchaseType } = req.body;
    if (!voucherCode) {
      return res.status(400).json({ message: "Voucher code is required" });
    }

    let items = [];
    if (productId) {
      const product = await Product.findById(productId).populate("sellerId");
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      items = [{
        product,
        quantity: Number(quantity) || 1,
        selectedColor: selectedColor || "",
        selectedSize: selectedSize || "",
        purchaseType: purchaseType || "one_time"
      }];
    } else {
      const cart = await Cart.findOne({ user: req.user._id }).populate({
        path: "items.product",
        populate: { path: "sellerId" }
      });

      if (!cart || cart.items.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      items = cart.items;
    }

    const result = await validateAndCalculateCartVoucher(voucherCode, items, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Voucher applied successfully",
      ...result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Validate seller upgrade voucher and calculate discount
 * @route POST /api/seller/vouchers/validate-upgrade
 */
export const validateSellerUpgradeVoucher = async (req, res) => {
  try {
    const { voucherCode, plan } = req.body;
    if (!voucherCode) {
      return res.status(400).json({ message: "Voucher code is required" });
    }
    if (!plan) {
      return res.status(400).json({ message: "Plan selection is required" });
    }

    const result = await validateUpgradeVoucher(voucherCode, plan, req.user._id);

    return res.status(200).json({
      success: true,
      message: "Voucher validated successfully",
      ...result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
