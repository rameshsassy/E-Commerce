import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";

// @desc    Validate and Apply Coupon
// @route   POST /api/customer/coupons/apply
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    
    if (!coupon) return res.status(404).json({ message: "Invalid or expired coupon" });
    if (new Date() > coupon.expiryDate) return res.status(400).json({ message: "Coupon has expired" });
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ message: "Coupon usage limit reached" });

    // Fetch user cart
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const subtotal = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    
    if (subtotal < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount}` });
    }

    // Calculate discount
    let discount = (subtotal * coupon.discountPercentage) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }

    res.json({
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      discountAmount: discount,
      newTotal: subtotal - discount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new Coupon (Admin Only)
// @route   POST /api/admin/coupons
// @access  Private (Admin)
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercentage, maxDiscountAmount, minOrderAmount, expiryDate, usageLimit } = req.body;

    const couponData = {
      code: code ? code.toUpperCase() : undefined,
      discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
      minOrderAmount: minOrderAmount !== undefined && minOrderAmount !== '' ? Number(minOrderAmount) : 0,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    };

    if (maxDiscountAmount !== undefined && maxDiscountAmount !== '' && maxDiscountAmount !== null) {
      couponData.maxDiscountAmount = Number(maxDiscountAmount);
    }

    if (usageLimit !== undefined && usageLimit !== '' && usageLimit !== null) {
      couponData.usageLimit = Number(usageLimit);
    } else {
      couponData.usageLimit = null; // Null means unlimited
    }

    const coupon = await Coupon.create(couponData);
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
