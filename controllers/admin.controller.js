import User from "../models/User.js";
import Product from "../models/Product.js";

// ===============================
// 📋 GET ALL SELLERS
// ===============================
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ role: "seller" }).select("-password");

    res.json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔍 GET PENDING SELLERS
// ===============================
export const getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({
      role: "seller",
      status: "pending",
    }).select("-password");

    res.json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 GET PENDING KYC
// ===============================
export const getPendingKYC = async (req, res) => {
  try {
    const sellers = await User.find({
      role: "seller",
      kycStatus: "pending",
    }).select("-password");

    res.json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET PENDING PRODUCTS
// ===============================
export const getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({
      approvalStatus: "pending",
    }).populate("sellerId", "firstName email status");

    res.json({
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ APPROVE SELLER
// ===============================
export const approveSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.status = "approved";
    await seller.save();

    res.json({ message: "Seller approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ REJECT SELLER
// ===============================
export const rejectSeller = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.status = "rejected";
    await seller.save();

    res.json({ message: "Seller rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ APPROVE KYC
// ===============================
export const approveKYC = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.kycStatus = "approved";
    seller.status = "approved";

    await seller.save();

    res.json({ message: "KYC approved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ REJECT KYC
// ===============================
export const rejectKYC = async (req, res) => {
  try {
    const seller = await User.findById(req.params.id);

    if (!seller || seller.role !== "seller") {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.kycStatus = "rejected";
    seller.status = "rejected";

    await seller.save();

    res.json({ message: "KYC rejected successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ APPROVE PRODUCT (FIXED 🔥)
// ===============================
export const approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("sellerId");

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 🔥 IMPORTANT: BLOCK IF KYC NOT APPROVED
    if (!product.sellerId || product.sellerId.status !== "approved") {
      return res.status(400).json({
        message: "Seller KYC not approved. Cannot approve product.",
      });
    }

    product.approvalStatus = "approved";
    await product.save();

    res.json({ message: "Product approved successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ REJECT PRODUCT
// ===============================
export const rejectProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.approvalStatus = "rejected";
    await product.save();

    res.json({ message: "Product rejected successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};