import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Coupon from "../models/Coupon.js";
import SupportTicket from "../models/SupportTicket.js";
import BulkInquiry from "../models/BulkInquiry.js";
import { notifyCustomersNewProduct } from "../services/email.service.js";
import { VALID_ADMIN_SECTIONS } from "../middleware/adminAccess.middleware.js";

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
      isDraft: { $ne: true },
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

    notifyCustomersNewProduct(product).catch((e) =>
      console.warn("New product notify emails:", e.message)
    );

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

// ===============================
// 📊 GET ANALYTICS
// ===============================
export const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "customer" });
    const totalSellers = await User.countDocuments({ role: "seller" });
    const premiumSellers = await User.countDocuments({ role: "seller", subscriptionActive: true });
    
    const pendingKYCs = await User.countDocuments({ role: "seller", kycStatus: "pending" });
    
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    
    const refundRequests = await ReturnRequest.countDocuments({ status: "Requested" });
    const pendingSupportTickets = await SupportTicket.countDocuments({ status: "Open" });
    const pendingBulkInquiries = await BulkInquiry.countDocuments({
      status: { $in: ["Negotiation Pending", "Meeting Scheduled"] },
    });

    // Revenue calc
    const orders = await Order.find({ paymentStatus: "completed" });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    res.json({
      totalUsers,
      totalSellers,
      premiumSellers,
      totalProducts,
      totalOrders,
      totalRevenue,
      pendingKYCs,
      refundRequests,
      pendingSupportTickets,
      pendingBulkInquiries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🛒 GET ALL ORDERS
// ===============================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔙 GET ALL RETURNS
// ===============================
export const getAllReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find()
      .populate("order", "totalAmount")
      .populate("user", "firstName email")
      .populate("seller", "firstName")
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🎟️ GET ALL COUPONS
// ===============================
export const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 👤 ADMIN STAFF (ROLES) — super admin only via routes
// ===============================
export const listAdminStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "admin_staff" })
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAdminStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, password, adminAccessLevel, adminAllowedSections } =
      req.body;

    if (!firstName || !email || !password || !adminAccessLevel) {
      return res.status(400).json({ message: "firstName, email, password, and adminAccessLevel are required" });
    }

    if (!["full", "limited"].includes(adminAccessLevel)) {
      return res.status(400).json({ message: "adminAccessLevel must be full or limited" });
    }

    let sections = Array.isArray(adminAllowedSections) ? adminAllowedSections : [];
    const invalid = sections.filter((s) => !VALID_ADMIN_SECTIONS.includes(s));
    if (invalid.length) {
      return res.status(400).json({ message: "Invalid section keys", invalid });
    }

    if (adminAccessLevel === "limited" && sections.length === 0) {
      return res.status(400).json({
        message: "Limited access requires at least one allowed area",
      });
    }

    if (adminAccessLevel === "full") {
      sections = [];
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: "admin_staff",
      status: "approved",
      adminAccessLevel,
      adminAllowedSections: sections,
    });

    res.status(201).json({
      message: "Admin role created successfully",
      staff: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        adminAccessLevel: user.adminAccessLevel,
        adminAllowedSections: user.adminAllowedSections,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, adminAccessLevel, adminAllowedSections, password } = req.body;

    const user = await User.findOne({ _id: id, role: "admin_staff" });
    if (!user) {
      return res.status(404).json({ message: "Admin role not found" });
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();

    if (adminAccessLevel !== undefined) {
      if (!["full", "limited"].includes(adminAccessLevel)) {
        return res.status(400).json({ message: "adminAccessLevel must be full or limited" });
      }
      user.adminAccessLevel = adminAccessLevel;
      if (adminAccessLevel === "full") {
        user.adminAllowedSections = [];
      }
    }

    if (adminAllowedSections !== undefined) {
      const sections = Array.isArray(adminAllowedSections) ? adminAllowedSections : [];
      const invalid = sections.filter((s) => !VALID_ADMIN_SECTIONS.includes(s));
      if (invalid.length) {
        return res.status(400).json({ message: "Invalid section keys", invalid });
      }
      if (user.adminAccessLevel === "limited") {
        user.adminAllowedSections = sections;
      }
    }

    if (user.adminAccessLevel === "limited" && (user.adminAllowedSections || []).length === 0) {
      return res.status(400).json({
        message: "Limited access requires at least one allowed area",
      });
    }

    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      message: "Admin role updated",
      staff: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        adminAccessLevel: user.adminAccessLevel,
        adminAllowedSections: user.adminAllowedSections,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAdminStaff = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: "admin_staff",
    });
    if (!user) {
      return res.status(404).json({ message: "Admin role not found" });
    }
    res.json({ message: "Admin role removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};