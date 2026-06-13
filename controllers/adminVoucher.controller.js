import AdminVoucher from "../models/AdminVoucher.js";
import Coupon from "../models/Coupon.js";
import Voucher from "../models/Voucher.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

// @desc    Get all admin vouchers
// @route   GET /api/admin/vouchers
// @access  Private (Admin)
export const getAdminVouchers = async (req, res) => {
  try {
    const vouchers = await AdminVoucher.find()
      .populate("selectedProducts", "title price")
      .populate("selectedSellers", "firstName lastName businessName email")
      .sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get search data (sellers & products) for admin voucher creation
// @route   GET /api/admin/vouchers/search-data
// @access  Private (Admin)
export const getVoucherSearchData = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller", status: "approved" }).select(
      "firstName lastName businessName email"
    );
    const products = await Product.find({ approvalStatus: "approved" }).select(
      "title price sellerId"
    );
    res.json({ sellers, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new admin voucher
// @route   POST /api/admin/vouchers
// @access  Private (Admin)
export const createAdminVoucher = async (req, res) => {
  try {
    const {
      voucherType,
      voucherCode,
      discountType,
      discountValue,
      expiry,
      usageLimit,
      note,
      selectedPlans,
      selectedProducts,
      selectedSellers,
      sellerProductScope,
      sellerSpecificProducts,
    } = req.body;

    // Validation
    if (!voucherType) {
      return res.status(400).json({ message: "Voucher type is required" });
    }
    if (!voucherCode || !voucherCode.trim()) {
      return res.status(400).json({ message: "Voucher code is required" });
    }
    if (!discountValue || parseFloat(discountValue) <= 0) {
      return res.status(400).json({ message: "Enter a valid discount" });
    }
    if (discountType === "percent" && parseFloat(discountValue) > 100) {
      return res.status(400).json({ message: "Discount cannot exceed 100%" });
    }
    if (!expiry) {
      return res.status(400).json({ message: "Expiry date is required" });
    }

    const codeUpper = voucherCode.trim().toUpperCase();

    // Check uniqueness across AdminVouchers, Coupons, and Seller Vouchers
    const adminVoucherExists = await AdminVoucher.findOne({ voucherCode: codeUpper });
    const couponExists = await Coupon.findOne({ code: codeUpper });
    const voucherExists = await Voucher.findOne({ voucherCode: codeUpper });

    if (adminVoucherExists || couponExists || voucherExists) {
      return res.status(400).json({ message: `Voucher/Coupon code ${codeUpper} is already in use` });
    }

    // Specific type validation
    if (voucherType === "seller_subscription" && (!selectedPlans || selectedPlans.length === 0)) {
      return res.status(400).json({ message: "Select at least one plan" });
    }
    if (voucherType === "customer_specific" && (!selectedProducts || selectedProducts.length === 0)) {
      return res.status(400).json({ message: "Select at least one product" });
    }
    if (voucherType === "seller_products" && (!selectedSellers || selectedSellers.length === 0)) {
      return res.status(400).json({ message: "Select at least one seller" });
    }
    if (voucherType === "seller_products" && sellerProductScope === "specific") {
      const missing = selectedSellers.filter(
        (sid) =>
          !sellerSpecificProducts ||
          !sellerSpecificProducts[sid] ||
          sellerSpecificProducts[sid].length === 0
      );
      if (missing.length > 0) {
        return res.status(400).json({ message: "Select products for each chosen seller" });
      }
    }

    // Save
    const voucherData = {
      voucherType,
      voucherCode: codeUpper,
      discountType,
      discountValue: parseFloat(discountValue),
      expiry: new Date(expiry),
      usageLimit: usageLimit ? parseInt(usageLimit) : null,
      note: note || "",
      selectedPlans: voucherType === "seller_subscription" ? selectedPlans : [],
      selectedProducts: voucherType === "customer_specific" ? selectedProducts : [],
      selectedSellers: voucherType === "seller_products" ? selectedSellers : [],
      sellerProductScope: voucherType === "seller_products" ? sellerProductScope : "all",
      sellerSpecificProducts:
        voucherType === "seller_products" && sellerProductScope === "specific"
          ? sellerSpecificProducts
          : {},
    };

    const voucher = await AdminVoucher.create(voucherData);

    res.status(201).json({
      message: "Voucher created successfully",
      voucher,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an admin voucher
// @route   DELETE /api/admin/vouchers/:id
// @access  Private (Admin)
export const deleteAdminVoucher = async (req, res) => {
  try {
    const voucher = await AdminVoucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Voucher not found" });
    }
    res.json({ message: "Voucher deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
