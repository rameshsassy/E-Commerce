import Voucher from "../models/Voucher.js";
import Coupon from "../models/Coupon.js";
import Product from "../models/Product.js";

// @desc    Create a new seller voucher
// @route   POST /api/seller/vouchers
// @access  Private (Seller only)
export const createVoucher = async (req, res) => {
  try {
    const {
      scope,
      productId,
      voucherCode,
      discountType,
      discountValue,
      minOrder,
      usageLimit,
      expiry,
      description
    } = req.body;

    const sellerId = req.user._id;

    // Validate code
    if (!voucherCode || !voucherCode.trim()) {
      return res.status(400).json({ message: "Voucher code is required" });
    }

    const codeUpper = voucherCode.trim().toUpperCase();

    // Validate discount
    const discVal = parseFloat(discountValue);
    if (isNaN(discVal) || discVal <= 0) {
      return res.status(400).json({ message: "Enter a valid discount amount" });
    }
    if (discountType === "percent" && discVal > 100) {
      return res.status(400).json({ message: "Percentage cannot exceed 100" });
    }

    // Validate scope and product
    if (scope === "specific") {
      if (!productId) {
        return res.status(400).json({ message: "Please select a product" });
      }
      const product = await Product.findOne({ _id: productId, sellerId });
      if (!product) {
        return res.status(400).json({ message: "Invalid product selected" });
      }
    }

    // Validate expiry
    if (!expiry) {
      return res.status(400).json({ message: "Expiry date is required" });
    }
    if (new Date(expiry) < new Date(new Date().setHours(0, 0, 0, 0))) {
      return res.status(400).json({ message: "Expiry date cannot be in the past" });
    }

    // Check uniqueness across Vouchers and Coupons
    const voucherExists = await Voucher.findOne({ voucherCode: codeUpper });
    const couponExists = await Coupon.findOne({ code: codeUpper });

    if (voucherExists || couponExists) {
      return res.status(400).json({ message: `Voucher code ${codeUpper} is already in use` });
    }

    // Prepare voucher data
    const voucherData = {
      sellerId,
      scope,
      productId: scope === "specific" ? productId : null,
      voucherCode: codeUpper,
      discountType,
      discountValue: discVal,
      minOrder: minOrder ? parseFloat(minOrder) : 0,
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      expiry: new Date(expiry),
      description: description || "",
      isActive: true
    };

    const voucher = await Voucher.create(voucherData);
    
    // Populate product details if it's a specific product voucher
    if (voucher.scope === "specific") {
      await voucher.populate("productId", "title name price");
    }

    res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      voucher
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vouchers created by the seller
// @route   GET /api/seller/vouchers
// @access  Private (Seller only)
export const getSellerVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find({ sellerId: req.user._id })
      .populate("productId", "title name price")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      vouchers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Deactivate a voucher
// @route   DELETE /api/seller/vouchers/:id
// @access  Private (Seller only)
export const deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findOneAndDelete({
      _id: req.params.id,
      sellerId: req.user._id
    });

    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
