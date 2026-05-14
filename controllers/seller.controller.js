import mongoose from "mongoose";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import { sendPremiumUpgradeEmail } from "../services/email.service.js";
import { absoluteToWebPath } from "../utils/uploadPaths.js";

function getRazorpayOrThrow() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    const err = new Error(
      "Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment."
    );
    err.statusCode = 503;
    throw err;
  }
  return new Razorpay({ key_id, key_secret });
}

/** Total charged in paise (₹9,125 + 18% GST = ₹10,767.50 → 1076750) */
function getPremiumAmountPaise() {
  const raw = process.env.PREMIUM_SUBSCRIPTION_AMOUNT_PAISE;
  const n = raw != null ? parseInt(String(raw), 10) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 1076750;
}

function safeCompareHex(a, b) {
  try {
    const ba = Buffer.from(String(a), "hex");
    const bb = Buffer.from(String(b), "hex");
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

// ===============================
// 📊 SELLER DASHBOARD
// ===============================
export const getDashboard = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete approval to access dashboard",
      });
    }

    const sellerId = new mongoose.Types.ObjectId(req.user._id);

    const stats = await Product.aggregate([
      {
        $match: {
          sellerId: sellerId,
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStock: { $sum: "$stock" },
          totalValue: {
            $sum: { $multiply: ["$price", "$stock"] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalStock: 0,
      totalValue: 0,
    };

    res.status(200).json({
      message: "Dashboard fetched successfully",
      data: result,
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard" });
  }
};

// ===============================
// 📈 SELLER ANALYTICS DASHBOARD
// ===============================
export const getAnalytics = async (req, res) => {
  try {
    const sellerId = new mongoose.Types.ObjectId(req.user._id);

    // 1. Basic Stats (Revenue, Orders, Products Sold, Pending)
    // We can get this from Orders that contain items from this seller
    const orders = await Order.find({ "items.seller": sellerId, paymentStatus: "completed" });
    
    let totalRevenue = 0;
    let productsSold = 0;
    let totalOrders = orders.length;
    let pendingOrders = 0;
    
    const locationCounts = {};
    const productCounts = {};
    
    // Last 30 days data for chart
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const salesChartMap = {};
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      salesChartMap[d.toISOString().split('T')[0]] = 0;
    }

    orders.forEach(order => {
      // Check if pending
      if (order.orderStatus === 'Processing' || order.orderStatus === 'Packed') {
        pendingOrders++;
      }
      
      const dateKey = new Date(order.createdAt).toISOString().split('T')[0];

      // Location parsing
      const city = order.shippingAddress?.city || 'Unknown';
      locationCounts[city] = (locationCounts[city] || 0) + 1;

      order.items.forEach(item => {
        if (item.seller.toString() === sellerId.toString()) {
          const itemRev = item.price * item.quantity;
          totalRevenue += itemRev;
          productsSold += item.quantity;
          
          // Chart
          if (salesChartMap[dateKey] !== undefined) {
            salesChartMap[dateKey] += itemRev;
          }
          
          // Top products
          const pId = item.product.toString();
          if (!productCounts[pId]) {
            productCounts[pId] = { id: pId, title: item.title, quantity: 0, revenue: 0 };
          }
          productCounts[pId].quantity += item.quantity;
          productCounts[pId].revenue += itemRev;
        }
      });
    });

    const salesChart = Object.keys(salesChartMap).map(date => ({
      date,
      revenue: salesChartMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    const topProducts = Object.values(productCounts).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topLocations = Object.entries(locationCounts).map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Monthly Growth (Mocking current month vs last month logic for simplicity)
    const monthlyGrowth = totalRevenue > 0 ? 12.5 : 0; 

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        productsSold,
        pendingOrders,
        monthlyGrowth,
        salesChart,
        topProducts,
        topLocations
      }
    });

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch analytics data" });
  }
};

// ===============================
// 👤 GET SELLER PROFILE
// ===============================
export const getSellerProfile = async (req, res) => {
  try {
    const user = req.user;

    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      mobile: user.mobile,
      businessName: user.businessName,
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
      address: user.address,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      isHyperlocal: user.isHyperlocal,
      deliverablePincodes: user.deliverablePincodes,
      status: user.status,
      kycStatus: user.kycStatus, // ✅ added
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET SELLER PRODUCTS
// ===============================
export const getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE SELLER PROFILE
// ===============================
export const updateSellerProfile = async (req, res) => {
  try {
    const user = req.user;

    const {
      firstName,
      lastName,
      mobile,
      businessName,
      address,
      city,
      state,
      pincode,
      isHyperlocal,
      deliverablePincodes
    } = req.body;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.mobile = mobile || user.mobile;
    user.businessName = businessName || user.businessName;
    user.address = address || user.address;
    user.city = city || user.city;
    user.state = state || user.state;
    user.pincode = pincode || user.pincode;
    
    if (isHyperlocal !== undefined) {
      user.isHyperlocal = isHyperlocal;
    }
    
    if (deliverablePincodes !== undefined) {
      // If it's a string from a comma-separated list, split it
      if (typeof deliverablePincodes === 'string') {
        user.deliverablePincodes = deliverablePincodes.split(',').map(p => p.trim()).filter(Boolean);
      } else if (Array.isArray(deliverablePincodes)) {
        user.deliverablePincodes = deliverablePincodes;
      }
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📄 SUBMIT KYC
// ===============================
export const submitKYC = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { panNumber, aadhaarNumber } = req.body;

    if (!panNumber || !aadhaarNumber) {
      return res.status(400).json({
        message: "PAN and Aadhaar are required",
      });
    }

    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        message: "Upload PAN and Aadhaar images",
      });
    }

    const panImage = absoluteToWebPath(req.files[0].path);
    const aadhaarImage = absoluteToWebPath(req.files[1].path);

    user.panNumber = panNumber;
    user.aadhaarNumber = aadhaarNumber;
    user.panImage = panImage;
    user.aadhaarImage = aadhaarImage;

    user.kycStatus = "pending";
    user.status = "kyc_submitted";

    await user.save();

    res.json({
      message: "KYC submitted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 1 (Organization Details)
// ===============================
export const submitKycStep1 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { elevatorPitch, officialName, entityType, storeAddresses } = req.body;
    
    // Logo is optional during this step, but typically required
    let organizationLogo = user.organizationLogo;
    if (req.file) {
      organizationLogo = absoluteToWebPath(req.file.path);
    }

    // Update user details
    user.elevatorPitch = elevatorPitch || user.elevatorPitch;
    user.officialName = officialName || user.officialName;
    user.entityType = entityType || user.entityType;
    
    if (storeAddresses) {
      // Expecting storeAddresses to be an array of strings, or a single string
      user.storeAddresses = Array.isArray(storeAddresses) ? storeAddresses : [storeAddresses];
    }
    
    user.organizationLogo = organizationLogo;

    // Optional: we could change user.kycStatus = "step1_completed" or keep it as is
    // Let's just save the updated info for now
    await user.save();

    res.json({
      message: "Organization details saved successfully",
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🚀 SUBMIT KYC STEP 2 (Business Documents)
// ===============================
export const submitKycStep2 = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({
        message: "Only sellers can submit KYC",
      });
    }

    const { dateOfRegistration, adminCostPercentage, registrationNumber, orgPanNumber, gstNumber, agreedToTerms } = req.body;

    // Update text fields
    user.dateOfRegistration = dateOfRegistration || user.dateOfRegistration;
    if (adminCostPercentage !== undefined) user.adminCostPercentage = Number(adminCostPercentage);
    user.registrationNumber = registrationNumber || user.registrationNumber;
    user.orgPanNumber = orgPanNumber || user.orgPanNumber;
    user.gstNumber = gstNumber || user.gstNumber;
    
    if (agreedToTerms !== undefined) {
      user.agreedToTerms = agreedToTerms === 'true' || agreedToTerms === true;
    }

    // Update files if provided
    if (req.files) {
      if (req.files.registrationCertificate && req.files.registrationCertificate[0]) {
        user.registrationCertificate = absoluteToWebPath(req.files.registrationCertificate[0].path);
      }
      if (req.files.orgPanImage && req.files.orgPanImage[0]) {
        user.orgPanImage = absoluteToWebPath(req.files.orgPanImage[0].path);
      }
      if (req.files.cancelledCheckImage && req.files.cancelledCheckImage[0]) {
        user.cancelledCheckImage = absoluteToWebPath(req.files.cancelledCheckImage[0].path);
      }
      if (req.files.gstImage && req.files.gstImage[0]) {
        user.gstImage = absoluteToWebPath(req.files.gstImage[0].path);
      }
    }

    await user.save();

    res.json({
      message: "Business documents saved successfully",
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
      gstNumber: user.gstNumber,
      gstImage: user.gstImage,
      agreedToTerms: user.agreedToTerms,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✅ FINALIZE KYC (Submit for Verification)
// ===============================
export const finalizeKyc = async (req, res) => {
  try {
    const user = req.user;

    if (user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can submit KYC" });
    }

    // Check required fields
    const requiredFields = {
      organizationLogo: user.organizationLogo,
      elevatorPitch: user.elevatorPitch,
      officialName: user.officialName,
      entityType: user.entityType,
      storeAddresses: user.storeAddresses && user.storeAddresses.length > 0 ? true : null,
      dateOfRegistration: user.dateOfRegistration,
      adminCostPercentage: user.adminCostPercentage !== undefined ? true : null,
      registrationNumber: user.registrationNumber,
      registrationCertificate: user.registrationCertificate,
      orgPanNumber: user.orgPanNumber,
      orgPanImage: user.orgPanImage,
      cancelledCheckImage: user.cancelledCheckImage,
    };

    const missingFields = [];
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value) {
        missingFields.push(key);
      }
    }

    if (!user.agreedToTerms) {
      missingFields.push("agreedToTerms (must agree to terms and conditions)");
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "Please fill all required fields before submitting.",
        missingFields,
      });
    }

    // If everything is valid, update statuses
    user.kycStatus = "pending"; // Pending admin approval
    user.status = "kyc_submitted";

    await user.save();

    res.json({
      message: "KYC submitted successfully for verification!",
      kycStatus: user.kycStatus,
      status: user.status,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 💎 CREATE SUBSCRIPTION ORDER (Razorpay)
// ===============================
export const createSubscriptionOrder = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can subscribe." });
    }

    if (user.sellerType === "premium" && user.subscriptionActive === true) {
      return res.status(400).json({ message: "Premium is already active on your account." });
    }

    let rzp;
    try {
      rzp = getRazorpayOrThrow();
    } catch (e) {
      return res.status(e.statusCode || 503).json({ message: e.message });
    }

    const amount = getPremiumAmountPaise();
    const receipt = `sub_${user._id.toString().slice(-8)}_${Date.now()}`.slice(0, 40);

    const order = await rzp.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        purpose: "premium_seller_subscription",
        sellerId: user._id.toString(),
      },
    });

    if (!order?.id) {
      return res.status(502).json({ message: "Could not create payment order. Try again." });
    }

    user.pendingPremiumOrderId = order.id;
    user.pendingPremiumOrderAt = new Date();
    await user.save();

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error) {
    console.error("[seller] createSubscriptionOrder:", error?.message || error);
    res.status(500).json({
      message: error?.error?.description || error?.message || "Failed to create Razorpay order",
    });
  }
};

// ===============================
// 💎 VERIFY SUBSCRIPTION PAYMENT (Razorpay)
// ===============================
export const verifySubscriptionPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: "Missing payment details (razorpayOrderId, razorpayPaymentId, razorpaySignature).",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ message: "Razorpay is not configured on the server." });
    }

    const sign = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSign = crypto.createHmac("sha256", keySecret).update(sign).digest("hex");

    if (!safeCompareHex(expectedSign, razorpaySignature)) {
      return res.status(400).json({ message: "Invalid payment signature." });
    }

    let rzp;
    try {
      rzp = getRazorpayOrThrow();
    } catch (e) {
      return res.status(e.statusCode || 503).json({ message: e.message });
    }

    const payment = await rzp.payments.fetch(razorpayPaymentId);

    if (!payment.order_id || payment.order_id !== razorpayOrderId) {
      return res.status(400).json({ message: "Payment does not match this order." });
    }

    if (payment.status !== "captured") {
      return res
        .status(400)
        .json({ message: `Payment is not captured yet (status: ${payment.status}).` });
    }

    let order;
    try {
      order = await rzp.orders.fetch(razorpayOrderId);
    } catch {
      return res.status(400).json({ message: "Invalid or expired order id." });
    }

    const expectedAmount = getPremiumAmountPaise();
    if (Number(order.amount) !== expectedAmount) {
      return res.status(400).json({ message: "Order amount does not match the current subscription price." });
    }

    const noteSellerId = order?.notes?.sellerId ?? order?.notes?.seller_id;
    if (!noteSellerId || String(noteSellerId) !== String(req.user._id)) {
      return res.status(403).json({ message: "This order does not belong to your seller account." });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== "seller") {
      return res.status(403).json({ message: "Only sellers can activate premium." });
    }

    if (
      user.premiumLastPaymentId === razorpayPaymentId &&
      user.sellerType === "premium" &&
      user.subscriptionActive
    ) {
      return res.json({
        message: "Premium is already active on your account.",
        sellerType: user.sellerType,
        bulkPurchaseEnabled: user.bulkPurchaseEnabled,
        subscriptionActive: user.subscriptionActive,
      });
    }

    const paidAmount = Number(payment.amount);
    if (Number.isFinite(paidAmount) && paidAmount !== expectedAmount) {
      return res.status(400).json({ message: "Paid amount does not match the subscription price." });
    }

    const wasAlreadyPremium =
      user.sellerType === "premium" && user.subscriptionActive === true;

    user.sellerType = "premium";
    user.bulkPurchaseEnabled = true;
    user.subscriptionActive = true;
    user.pendingPremiumOrderId = null;
    user.pendingPremiumOrderAt = null;
    user.premiumLastPaymentId = razorpayPaymentId;

    await user.save();

    if (!wasAlreadyPremium) {
      sendPremiumUpgradeEmail(user).catch((e) =>
        console.error("Premium upgrade email failed:", e?.message || e)
      );
    }

    return res.json({
      message: "Premium Activated Successfully",
      sellerType: user.sellerType,
      bulkPurchaseEnabled: user.bulkPurchaseEnabled,
      subscriptionActive: user.subscriptionActive,
    });
  } catch (error) {
    console.error("[seller] verifySubscriptionPayment:", error?.message || error);
    res.status(500).json({
      message: error?.error?.description || error?.message || "Verification failed",
    });
  }
};

// ===============================
// 💎 TEST / MANUAL PREMIUM UPGRADE (non-prod or ALLOW_TEST_PREMIUM_UPGRADE)
// ===============================
export const upgradeSellerToPremiumManual = async (req, res) => {
  const allow =
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_TEST_PREMIUM_UPGRADE === "true";
  if (!allow) {
    return res.status(403).json({
      message:
        "Manual premium upgrade is not enabled. Complete checkout to activate Premium.",
    });
  }
  try {
    const user = req.user;
    const already =
      user.sellerType === "premium" && user.subscriptionActive === true;
    if (!already) {
      user.sellerType = "premium";
      user.bulkPurchaseEnabled = true;
      user.subscriptionActive = true;
      user.pendingPremiumOrderId = null;
      user.pendingPremiumOrderAt = null;
      await user.save();
      sendPremiumUpgradeEmail(user).catch((e) =>
        console.log("Premium upgrade email failed:", e.message)
      );
    }
    return res.json({
      message: already
        ? "Premium is already active on your account."
        : "Premium Activated Successfully",
      sellerType: user.sellerType,
      bulkPurchaseEnabled: user.bulkPurchaseEnabled,
      subscriptionActive: user.subscriptionActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};