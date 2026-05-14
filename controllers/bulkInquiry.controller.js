import jwt from "jsonwebtoken";
import Product from "../models/Product.js";
import User from "../models/User.js";
import BulkInquiry from "../models/BulkInquiry.js";
import {
  sendBulkInquirySellerEmail,
  sendBulkInquiryAdminEmail,
  sendBulkInquiryBuyerConfirmation,
} from "../services/email.service.js";

const appBaseUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

function sellerIsPremium(seller) {
  if (!seller) return false;
  return (
    seller.sellerType === "premium" &&
    seller.subscriptionActive === true &&
    seller.bulkPurchaseEnabled !== false
  );
}

async function optionalCustomerId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(decoded.id).select("role");
    if (u && u.role === "customer") return u._id;
  } catch {
    return null;
  }
  return null;
}

/**
 * POST /api/products/:id/bulk-inquiry
 * Only allowed when the product's seller is a premium (active subscription) seller.
 */
export const createBulkInquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contactNumber, email, quantityRequired, message } = req.body;

    if (!name?.trim() || !contactNumber?.trim() || !email?.trim() || !quantityRequired?.trim()) {
      return res.status(400).json({
        message: "Name, contact number, email, and quantity required are required.",
      });
    }

    const product = await Product.findById(id).populate({
      path: "sellerId",
      select:
        "firstName lastName email businessName sellerType subscriptionActive bulkPurchaseEnabled",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isActive || product.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Product not available" });
    }

    const seller = product.sellerId;
    if (!sellerIsPremium(seller)) {
      return res.status(403).json({
        message:
          "Bulk orders are only available for products sold by Premium sellers. This seller is not eligible.",
      });
    }

    const buyerId = await optionalCustomerId(req);

    const inquiry = await BulkInquiry.create({
      sellerId: seller._id,
      productId: product._id,
      buyerId,
      buyerName: name.trim(),
      buyerEmail: email.trim().toLowerCase(),
      buyerPhone: contactNumber.trim(),
      quantityRequired: String(quantityRequired).trim(),
      message: typeof message === "string" ? message.trim() : "",
    });

    const inquiryPayload = {
      inquiryId: inquiry._id,
      buyerName: inquiry.buyerName,
      buyerEmail: inquiry.buyerEmail,
      buyerPhone: inquiry.buyerPhone,
      quantityRequired: inquiry.quantityRequired,
      message: inquiry.message,
      productTitle: product.title,
      productId: product._id,
      productUrl: `${appBaseUrl()}/product/${product._id}`,
    };

    await Promise.allSettled([
      sendBulkInquirySellerEmail(seller, inquiryPayload),
      sendBulkInquiryAdminEmail(inquiryPayload),
      sendBulkInquiryBuyerConfirmation(inquiryPayload),
    ]);

    return res.status(201).json({
      message:
        "Bulk inquiry submitted successfully. You will receive a confirmation email shortly. Our team may contact you to coordinate next steps.",
      inquiryId: inquiry._id,
    });
  } catch (error) {
    console.error("createBulkInquiry:", error);
    res.status(500).json({ message: error.message || "Failed to submit bulk inquiry" });
  }
};

const INQUIRY_STATUSES = [
  "Negotiation Pending",
  "Meeting Scheduled",
  "Completed",
  "Cancelled",
];

/**
 * GET /api/seller/bulk-inquiries — inquiries for the logged-in seller's products
 */
export const listSellerBulkInquiries = async (req, res) => {
  try {
    const inquiries = await BulkInquiry.find({ sellerId: req.user._id })
      .populate("productId", "title")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: inquiries.length,
      inquiries: inquiries.map((row) => ({
        ...row,
        productTitle: row.productId?.title || "—",
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/admin/bulk-inquiries — all bulk inquiries (coordination)
 */
export const listAdminBulkInquiries = async (req, res) => {
  try {
    const inquiries = await BulkInquiry.find({})
      .populate("productId", "title")
      .populate("sellerId", "firstName lastName email businessName")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      count: inquiries.length,
      inquiries: inquiries.map((row) => ({
        ...row,
        productTitle: row.productId?.title || "—",
        sellerLabel:
          row.sellerId?.businessName ||
          [row.sellerId?.firstName, row.sellerId?.lastName].filter(Boolean).join(" ") ||
          "—",
        sellerEmail: row.sellerId?.email,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PATCH status — seller (own only) or admin/staff
 */
export const updateBulkInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
        allowed: INQUIRY_STATUSES,
      });
    }

    const inquiry = await BulkInquiry.findById(id);
    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const isAdmin = req.user.role === "admin" || req.user.role === "admin_staff";
    const isSeller = req.user.role === "seller";

    if (isSeller) {
      if (inquiry.sellerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized" });
      }
    } else if (!isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    inquiry.status = status;
    await inquiry.save();

    const updated = await BulkInquiry.findById(inquiry._id)
      .populate("productId", "title")
      .populate("sellerId", "firstName lastName email businessName")
      .lean();

    res.json({
      message: "Inquiry updated",
      inquiry: {
        ...updated,
        productTitle: updated.productId?.title || "—",
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
