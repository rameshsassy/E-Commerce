import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Seller from "../models/Seller.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import Coupon from "../models/Coupon.js";
import SupportTicket from "../models/SupportTicket.js";
import BulkInquiry from "../models/BulkInquiry.js";
import { notifyCustomersNewProduct, sendKycApprovalEmail, sendKycRejectionEmail, sendWeeklySellerReport } from "../services/email.service.js";
import { VALID_ADMIN_SECTIONS } from "../middleware/adminAccess.middleware.js";
import { getWeeklySellerReportData } from "../cron/weeklyReports.js";
import { normalizeEmail, issueTokensAndSetCookie } from "./auth.controller.js";

// ===============================
// 📋 GET ALL SELLERS
// ===============================
export const getAllSellers = async (req, res) => {
  try {
    const sellers = await Seller.find().select("-password");

    res.json({
      count: sellers.length,
      sellers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📋 GET ALL CUSTOMERS
// ===============================
export const getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().select("-password");

    res.json({
      count: customers.length,
      customers,
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
    const sellers = await Seller.find({
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
    const sellers = await Seller.find({
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
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.status = "approved";
    seller.kycStatus = "approved";
    await seller.save();

    // Send KYC approval email to seller
    sendKycApprovalEmail(seller).catch((err) =>
      console.error("[admin] KYC approval email failed:", err?.message || err)
    );

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
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.status = "rejected";
    seller.kycStatus = "rejected";
    await seller.save();

    // Send KYC rejection email to seller
    sendKycRejectionEmail(seller).catch((err) =>
      console.error("[admin] KYC rejection email failed:", err?.message || err)
    );

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
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.kycStatus = "approved";
    seller.status = "approved";

    await seller.save();

    // Send KYC approval email to seller
    sendKycApprovalEmail(seller).catch((err) =>
      console.error("[admin] KYC approval email failed:", err?.message || err)
    );

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
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.kycStatus = "rejected";
    seller.status = "rejected";

    await seller.save();

    // Send KYC rejection email to seller
    sendKycRejectionEmail(seller).catch((err) =>
      console.error("[admin] KYC rejection email failed:", err?.message || err)
    );

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
    const totalUsers = await Customer.countDocuments();
    const totalSellers = await Seller.countDocuments();
    const premiumSellers = await Seller.countDocuments({ subscriptionActive: true });
    
    const pendingKYCs = await Seller.countDocuments({ kycStatus: "pending" });
    
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
      .populate("user", "firstName lastName email customerId")
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

// ===============================
// 📧 SEND WEEKLY SELLER RECAP
// ===============================
export const sendWeeklyRecapAction = async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);

    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const stats = await getWeeklySellerReportData(seller);
    await sendWeeklySellerReport(seller, stats);

    res.json({ message: `Weekly recap recap successfully sent to ${seller.firstName || "seller"}!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔐 SECURE ADMIN SIGNUP
// ===============================
export const signupAdmin = async (req, res) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const { fullName, email, phone, password, confirmPassword, secretKey } = req.body;

  try {
    // 1. Validate all fields are provided
    if (!fullName || !email || !phone || !password || !confirmPassword || !secretKey) {
      console.warn(`[Admin Signup Failed] Missing fields from IP: ${ip}`);
      return res.status(400).json({ success: false, message: "All fields are mandatory." });
    }

    // 2. Validate email format
    const trimmedEmail = typeof email === "string" ? email.trim() : "";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      console.warn(`[Admin Signup Failed] Invalid email format: "${trimmedEmail}" from IP: ${ip}`);
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    const normalizedEmail = normalizeEmail(trimmedEmail);

    // 3. Validate phone number format (must be standard phone number: e.g. 10-15 digits after cleaning)
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(cleanPhone)) {
      console.warn(`[Admin Signup Failed] Invalid phone number format: "${phone}" from IP: ${ip}`);
      return res.status(400).json({ success: false, message: "Invalid phone number" });
    }

    // 4. Validate password strength
    // Minimum 8 characters, One uppercase letter, One lowercase letter, One number, One special character
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#\-_+=\[\]{}|;:',.<>/?~`]/.test(password);
    if (password.length < 8 || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      console.warn(`[Admin Signup Failed] Weak password attempt from IP: ${ip}, Email: ${normalizedEmail}`);
      return res.status(400).json({ success: false, message: "Password does not meet security requirements" });
    }

    // 5. Verify password and confirm password match
    if (password !== confirmPassword) {
      console.warn(`[Admin Signup Failed] Passwords do not match from IP: ${ip}, Email: ${normalizedEmail}`);
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    // 6. Verify admin secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      if (typeof req.recordFailedSecretKeyAttempt === 'function') {
        req.recordFailedSecretKeyAttempt();
      }
      console.warn(`[Admin Signup Failed] Invalid admin secret key from IP: ${ip}, Email: ${normalizedEmail}`);
      return res.status(403).json({ success: false, message: "Invalid Admin Secret Key" });
    }

    // 7. Check if email already exists
    const emailExists = await User.findOne({ email: normalizedEmail });
    if (emailExists) {
      console.warn(`[Admin Signup Failed] Email already exists: ${normalizedEmail} from IP: ${ip}`);
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // 8. Check if phone number already exists
    const phoneExists = await User.findOne({ $or: [{ phone: cleanPhone }, { mobile: cleanPhone }] });
    if (phoneExists) {
      console.warn(`[Admin Signup Failed] Phone number already exists: ${cleanPhone} from IP: ${ip}`);
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }

    // 9. Hash password using bcrypt and create admin account
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await User.create({
      fullName: fullName.trim(),
      firstName: fullName.trim(), // legacy field fallback
      email: normalizedEmail,
      phone: cleanPhone,
      mobile: cleanPhone, // legacy field fallback
      password: hashedPassword,
      role: "admin",
      status: "active",
      lastLogin: new Date(),
    });

    console.log(`[Admin Signup Success] Admin created: ${admin._id}, Email: ${admin.email}, IP: ${ip}`);

    // 10. Generate JWT token and create session
    const token = await issueTokensAndSetCookie(admin, res, req);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      token,
      user: {
        _id: admin._id,
        fullName: admin.fullName,
        firstName: admin.firstName,
        email: admin.email,
        phone: admin.phone,
        role: admin.role,
        status: admin.status,
      }
    });

  } catch (error) {
    console.error(`[Admin Signup Error] ${error.message} from IP: ${ip}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// 👤 GET ADMIN PROFILE
// ===============================
export const getAdminProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile || user.phone || "",
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE ADMIN PROFILE
// ===============================
export const updateAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, email, mobile } = req.body;

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ message: "First name is required." });
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ message: "Invalid email format." });
      }
      // Check email uniqueness if changed
      if (email.trim().toLowerCase() !== req.user.email) {
        const existing = await User.findOne({
          email: email.trim().toLowerCase(),
          _id: { $ne: req.user._id },
        });
        if (existing) {
          return res.status(400).json({ message: "This email is already in use." });
        }
      }
    }

    const adminDoc = await User.findById(req.user._id);
    if (!adminDoc) return res.status(404).json({ message: "Admin not found." });

    adminDoc.firstName = firstName.trim();
    adminDoc.lastName = (lastName || "").trim();
    if (email) adminDoc.email = email.trim().toLowerCase();
    if (mobile !== undefined) {
      adminDoc.mobile = mobile;
      adminDoc.phone = mobile;
    }

    await adminDoc.save();

    res.json({
      message: "Profile updated successfully.",
      user: {
        _id: adminDoc._id,
        firstName: adminDoc.firstName,
        lastName: adminDoc.lastName,
        email: adminDoc.email,
        mobile: adminDoc.mobile || adminDoc.phone || "",
        role: adminDoc.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔑 CHANGE ADMIN PASSWORD
// ===============================
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    // Fetch admin with password field
    const adminDoc = await User.findById(req.user._id);
    if (!adminDoc) return res.status(404).json({ message: "Admin not found." });

    const isMatch = await bcrypt.compare(currentPassword, adminDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    adminDoc.password = await bcrypt.hash(newPassword, 10);
    await adminDoc.save();

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 👥 IMPERSONATE SELLER (Super Admin only)
// ===============================
export const impersonateSeller = async (req, res) => {
  try {
    const sellerId = req.params.id;
    const seller = await Seller.findById(sellerId);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    console.log(`[Impersonation Audit] Admin ${req.user._id} (${req.user.email}) started impersonating Seller ${seller._id} (${seller.email})`);

    // Generate JWT token containing the seller id and the impersonator id (admin id)
    const token = jwt.sign(
      { 
        id: seller._id, 
        role: "seller", 
        impersonatorId: req.user._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // 1 day
    );

    res.json({
      success: true,
      message: "Impersonation token generated successfully",
      token,
      user: {
        _id: seller._id,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        role: "seller",
        status: seller.status,
        businessName: seller.businessName,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 👥 IMPERSONATE CUSTOMER (Super Admin only)
// ===============================
export const impersonateCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    console.log(`[Impersonation Audit] Admin ${req.user._id} (${req.user.email}) started impersonating Customer ${customer._id} (${customer.email})`);

    // Generate JWT token containing the customer id and the impersonator id (admin id)
    const token = jwt.sign(
      { 
        id: customer._id, 
        role: "customer", 
        impersonatorId: req.user._id 
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" } // 1 day
    );

    res.json({
      success: true,
      message: "Impersonation token generated successfully",
      token,
      user: {
        _id: customer._id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        role: "customer",
        status: customer.status,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📋 UPDATE SELLER PLAN (Super Admin only)
// ===============================
export const updateSellerPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan } = req.body;

    if (!["free", "pro", "premium"].includes(plan)) {
      return res.status(400).json({ message: "Invalid plan. Must be standard (free), pro, or premium." });
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    seller.subscriptionPlan = plan;
    if (plan === "free") {
      seller.sellerType = "free";
      seller.subscriptionActive = false;
      seller.bulkPurchaseEnabled = false;
      seller.subscriptionValidUntil = null;
    } else {
      seller.sellerType = "premium";
      seller.subscriptionActive = true;
      seller.bulkPurchaseEnabled = true;
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
      seller.subscriptionValidUntil = validUntil;
    }

    await seller.save();

    res.json({
      message: "Seller plan updated successfully",
      seller: {
        _id: seller._id,
        sellerId: seller.sellerId,
        firstName: seller.firstName,
        lastName: seller.lastName,
        email: seller.email,
        subscriptionPlan: seller.subscriptionPlan,
        sellerType: seller.sellerType,
        subscriptionActive: seller.subscriptionActive,
        subscriptionValidUntil: seller.subscriptionValidUntil,
        bulkPurchaseEnabled: seller.bulkPurchaseEnabled,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};