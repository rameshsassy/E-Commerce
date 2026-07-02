import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import Seller from "../models/Seller.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import VoucherUsage from "../models/VoucherUsage.js";

// Helper to format Date as DD-MM-YYYY
function formatDate(date) {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to generate Invoice Number: sellerId + DDMMYYYY of the document date
// e.g. sellerId=1001, date=12-06-2026 => "100112062026"
function generateInvoiceNumber(sellerId, date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${sellerId}${day}${month}${year}`;
}

// PDF Builder Helpers
function generateInvoiceHeader(doc, title, invoiceNumber, docDate) {
  // Brand Header band
  doc.fillColor("#ffd401").rect(0, 0, doc.page.width, 30).fill();

  doc
    .fillColor("#1e293b")
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Aashansh", 50, 45)
    .fontSize(9)
    .font("Helvetica")
    .text("Conscious, inclusive, and impactful consumption", 50, 68)
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(title, 400, 45, { align: "right" })
    .fontSize(9)
    .font("Helvetica")
    .text(`Invoice No: ${invoiceNumber}`, 400, 62, { align: "right" })
    .text(`Date: ${docDate}`, 400, 75, { align: "right" });

  doc.moveDown(2);
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, 95).lineTo(550, 95).stroke();
}

function generateBillingDetails(doc, seller, buyer, isReceipt = false) {
  const y = 115;
  // Left Column: Seller / Issuer
  doc
    .fontSize(9)
    .font("Helvetica-Bold")
    .text("Service Provider / Seller:", 50, y)
    .font("Helvetica")
    .text(seller.businessName || `${seller.firstName} ${seller.lastName || ""}`, 50, y + 15)
    .text(seller.address || "", 50, y + 27)
    .text(`${seller.city || ""}, ${seller.state || ""} - ${seller.pincode || ""}`, 50, y + 39)
    .text(`Mobile: ${seller.mobile || seller.phone || ""}`, 50, y + 51)
    .text(`Email: ${seller.email || ""}`, 50, y + 63);

  let docIdY = y + 78;
  if (seller.gstNumber) {
    doc.font("Helvetica-Bold").text(`GSTIN: ${seller.gstNumber}`, 50, docIdY).font("Helvetica");
    docIdY += 12;
  }
  if (seller.panNumber || seller.orgPanNumber) {
    doc
      .font("Helvetica-Bold")
      .text(`PAN: ${seller.panNumber || seller.orgPanNumber}`, 50, docIdY)
      .font("Helvetica");
  }

  // Right Column: Customer / Recipient
  const rightX = 320;
  const buyerTitle = isReceipt ? "Issued To (Seller):" : "Bill To:";
  doc.font("Helvetica-Bold").text(buyerTitle, rightX, y).font("Helvetica");

  if (buyer) {
    doc
      .text(buyer.businessName || buyer.fullName || `${buyer.firstName || ""} ${buyer.lastName || ""}`, rightX, y + 15)
      .text(buyer.address || buyer.addressLine1 || "", rightX, y + 27)
      .text(`${buyer.city || ""}, ${buyer.state || ""} - ${buyer.pincode || buyer.pinCode || ""}`, rightX, y + 39)
      .text(`Phone: ${buyer.mobile || buyer.phone || ""}`, rightX, y + 51)
      .text(`Email: ${buyer.email || ""}`, rightX, y + 63);
  } else {
    doc
      .text("Aashansh Platform User", rightX, y + 15)
      .text("Online transaction", rightX, y + 27);
  }
}

function generateTable(doc, headers, rows, totalAmount, taxBreakdown = null) {
  const startY = 240;

  // Header background
  doc.fillColor("#f1f5f9").rect(50, startY, 500, 20).fill();
  doc.fillColor("#1e293b").font("Helvetica-Bold").fontSize(9);

  headers.forEach((h) => {
    doc.text(h.label, h.x, startY + 5, { width: h.width, align: h.align });
  });

  let currentY = startY + 20;
  doc.font("Helvetica").fontSize(9);

  rows.forEach((row) => {
    headers.forEach((h) => {
      const val = row[h.key];
      doc.text(String(val), h.x, currentY + 5, { width: h.width, align: h.align });
    });
    // Bottom border line
    doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, currentY + 20).lineTo(550, currentY + 20).stroke();
    currentY += 20;
  });

  // Totals Section
  currentY += 15;
  if (taxBreakdown) {
    doc.font("Helvetica").fontSize(9);
    doc.text("Subtotal:", 350, currentY, { width: 100, align: "right" });
    doc.text(`₹${taxBreakdown.subtotal.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
    currentY += 15;

    doc.text("CGST (9%):", 350, currentY, { width: 100, align: "right" });
    doc.text(`₹${taxBreakdown.cgst.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
    currentY += 15;

    doc.text("SGST (9%):", 350, currentY, { width: 100, align: "right" });
    doc.text(`₹${taxBreakdown.sgst.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
    currentY += 15;

    if (taxBreakdown.discount && taxBreakdown.discount > 0) {
      doc.text("Discount Applied:", 350, currentY, { width: 100, align: "right" });
      doc.text(`- ₹${taxBreakdown.discount.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
      currentY += 15;
    }
  }

  doc.font("Helvetica-Bold").fontSize(10);
  doc.text("Total Amount:", 300, currentY, { width: 150, align: "right" });
  doc.text(`₹${totalAmount.toFixed(2)}`, 450, currentY, { width: 100, align: "right" });
}

function generateFooter(doc, note) {
  doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, 720).lineTo(550, 720).stroke();

  doc
    .fontSize(8)
    .fillColor("#64748b")
    .text("Aashansh E-Commerce Portal", 50, 732, { align: "center" })
    .text(note || "This is a computer-generated document and does not require physical signature.", 50, 744, { align: "center" });
}

// ----------------------------------------------------
// 1. Get Seller Subscription Invoice Years
// ----------------------------------------------------
export const getSubscriptionYears = async (req, res) => {
  try {
    const seller = req.user;
    const years = [];

    if (seller.sellerType === "premium" && seller.subscriptionValidUntil) {
      let end = new Date(seller.subscriptionValidUntil);
      // Generate up to 5 subscription years
      for (let i = 0; i < 5; i++) {
        let start = new Date(end);
        start.setFullYear(start.getFullYear() - 1);
        start.setDate(start.getDate() + 1);

        const startStr = formatDate(start);
        const endStr = formatDate(end);
        years.push(`${startStr} to ${endStr}`);

        // Go back 1 year
        end = new Date(start);
        end.setDate(end.getDate() - 1);

        // Stop if the end date goes before account creation
        if (end < new Date(seller.createdAt)) {
          break;
        }
      }
    }

    res.json({ success: true, years });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 2. View/Download Subscription Invoice
// ----------------------------------------------------
export const downloadSubscriptionInvoice = async (req, res) => {
  try {
    const { yearRange, action } = req.query;
    if (!yearRange) {
      return res.status(400).json({ message: "Year range is required" });
    }

    const seller = req.user;
    let plan = seller.subscriptionPlan || "premium";
    let totalAmount = plan === "premium" ? 233640.0 : 10767.5;
    let discount = 0;

    // Check voucher usage
    const usage = await VoucherUsage.findOne({ userId: seller._id }).sort({ createdAt: -1 });
    if (usage) {
      totalAmount = usage.finalAmount;
      discount = usage.discountAmount;
    }

    const baseAmount = Math.round((totalAmount / 1.18) * 100) / 100;
    const gstAmount = Math.round((totalAmount - baseAmount) * 100) / 100;

    const invoiceDate = new Date();
    const invoiceNumber = generateInvoiceNumber(seller.sellerId, invoiceDate);
    const filename = `subscription_invoice_${yearRange.replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    if (action === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    generateInvoiceHeader(doc, "SUBSCRIPTION INVOICE", invoiceNumber, formatDate(invoiceDate));
    
    // Platform info as the issuer
    const platformIssuer = {
      businessName: "Funds And Toil Private Limited (Aashansh)",
      address: "Borivali",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400092",
      mobile: "+91 9867443283",
      email: "info@aashansh.org",
      gstNumber: "27AAACF8469C1Z1" // Mock GST of Aashansh
    };

    generateBillingDetails(doc, platformIssuer, seller);

    const headers = [
      { key: "desc", label: "Description", x: 50, width: 300, align: "left" },
      { key: "qty", label: "Qty", x: 350, width: 50, align: "center" },
      { key: "total", label: "Total", x: 450, width: 100, align: "right" }
    ];

    const rows = [
      {
        desc: `Aashansh Seller Premium Portal Subscription (${plan.toUpperCase()})\nPeriod: ${yearRange}`,
        qty: 1,
        total: `₹${baseAmount.toFixed(2)}`
      }
    ];

    generateTable(doc, headers, rows, totalAmount, {
      subtotal: baseAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      discount
    });

    generateFooter(doc, "Thank you for subscribing to Aashansh Premium Seller Services!");
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 3. Get Seller Sales Invoice Products
// ----------------------------------------------------
export const getSalesProducts = async (req, res) => {
  try {
    const sellerId = req.user._id;
    // Find all completed orders belonging to this seller
    const orders = await Order.find({
      "items.seller": sellerId,
      paymentStatus: "completed"
    }).sort({ createdAt: -1 });

    const products = [];
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.seller.toString() === sellerId.toString()) {
          products.push({
            id: `${order._id}_${item.product}`,
            label: `${item.title} | Purchased on ${formatDate(order.createdAt)} | ₹${item.price * item.quantity}`
          });
        }
      });
    });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 4. View/Download Sales Invoice by Product
// ----------------------------------------------------
export const downloadSalesInvoiceByProduct = async (req, res) => {
  try {
    const { productId, action } = req.query;
    if (!productId || !productId.includes("_")) {
      return res.status(400).json({ message: "Valid Product ID (orderId_productId) is required" });
    }

    const [orderId, prodId] = productId.split("_");
    const seller = req.user;

    const order = await Order.findOne({
      _id: orderId,
      "items.seller": seller._id,
      paymentStatus: "completed"
    }).populate("user");

    if (!order) {
      return res.status(404).json({ message: "Sales order record not found." });
    }

    const item = order.items.find(
      (i) => i.product.toString() === prodId && i.seller.toString() === seller._id.toString()
    );

    if (!item) {
      return res.status(404).json({ message: "Product item not found in this order." });
    }

    const itemTotal = item.price * item.quantity;
    const baseAmount = Math.round((itemTotal / 1.18) * 100) / 100;
    const gstAmount = Math.round((itemTotal - baseAmount) * 100) / 100;

    const invoiceNumber = generateInvoiceNumber(seller.sellerId, order.createdAt);
    const filename = `sales_invoice_${order._id.toString().slice(-6)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    if (action === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    generateInvoiceHeader(doc, "TAX INVOICE", invoiceNumber, formatDate(order.createdAt));

    // Buyer info
    const buyer = order.user
      ? {
          firstName: order.user.firstName || "Customer",
          lastName: order.user.lastName || "",
          address: order.shippingAddress ? `${order.shippingAddress.addressLine1 || ""} ${order.shippingAddress.addressLine2 || ""}`.trim() : "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          pincode: order.shippingAddress?.pinCode || "",
          mobile: order.shippingAddress?.phone || order.user.mobile || "",
          email: order.user.email || ""
        }
      : {
          fullName: order.shippingAddress?.fullName || "Valued Customer",
          address: order.shippingAddress ? `${order.shippingAddress.addressLine1 || ""} ${order.shippingAddress.addressLine2 || ""}`.trim() : "",
          city: order.shippingAddress?.city || "",
          state: order.shippingAddress?.state || "",
          pincode: order.shippingAddress?.pinCode || "",
          mobile: order.shippingAddress?.phone || "",
          email: ""
        };

    generateBillingDetails(doc, seller, buyer);

    const headers = [
      { key: "desc", label: "Product Title", x: 50, width: 250, align: "left" },
      { key: "price", label: "Unit Price", x: 300, width: 80, align: "right" },
      { key: "qty", label: "Qty", x: 390, width: 40, align: "center" },
      { key: "total", label: "Total", x: 440, width: 110, align: "right" }
    ];

    const rows = [
      {
        desc: item.title,
        price: `₹${(item.price / 1.18).toFixed(2)}`,
        qty: item.quantity,
        total: `₹${baseAmount.toFixed(2)}`
      }
    ];

    generateTable(doc, headers, rows, itemTotal, {
      subtotal: baseAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      discount: 0
    });

    generateFooter(doc, "Thank you for your business!");
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 5. View/Download Sales Invoice by Date Range
// ----------------------------------------------------
export const downloadSalesInvoiceByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const seller = req.user;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      "items.seller": seller._id,
      paymentStatus: "completed",
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 }).populate("user");

    if (orders.length === 0) {
      return res.status(404).json({ message: "No sales orders found in this date range." });
    }

    // Compile rows
    const rows = [];
    let grandTotal = 0;
    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (item.seller.toString() === seller._id.toString()) {
          const itemTotal = item.price * item.quantity;
          grandTotal += itemTotal;
          const base = Math.round((itemTotal / 1.18) * 100) / 100;
          rows.push({
            date: formatDate(order.createdAt),
            desc: item.title,
            qty: item.quantity,
            total: `₹${itemTotal.toFixed(2)}`
          });
        }
      });
    });

    const baseAmount = Math.round((grandTotal / 1.18) * 100) / 100;
    const gstAmount = Math.round((grandTotal - baseAmount) * 100) / 100;

    const invoiceDate = new Date();
    const invoiceNumber = generateInvoiceNumber(seller.sellerId, invoiceDate);
    const filename = `collective_sales_invoice_${formatDate(start)}_${formatDate(end)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    if (action === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    generateInvoiceHeader(doc, "COLLECTIVE TAX INVOICE", invoiceNumber, formatDate(invoiceDate));
    
    // Collective summary billing
    const buyerSummary = {
      fullName: "Multiple Platform Customers",
      address: "Collective Order Sales Report",
      city: "Various",
      state: "India",
      pincode: "",
      mobile: "",
      email: ""
    };

    generateBillingDetails(doc, seller, buyerSummary);

    const headers = [
      { key: "date", label: "Date", x: 50, width: 80, align: "left" },
      { key: "desc", label: "Product Title", x: 135, width: 230, align: "left" },
      { key: "qty", label: "Qty", x: 370, width: 40, align: "center" },
      { key: "total", label: "Total", x: 420, width: 130, align: "right" }
    ];

    generateTable(doc, headers, rows, grandTotal, {
      subtotal: baseAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      discount: 0
    });

    generateFooter(doc, `Collective Invoice Statement from ${formatDate(start)} to ${formatDate(end)}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to calculate referral rewards rates dynamically
function getReferralRewardRates(seller) {
  const isPremium = seller.sellerType === "premium" && seller.subscriptionActive === true;
  const activePlan = seller.subscriptionPlan || (isPremium ? "premium" : "free");

  let kycReward = 500;
  let premiumBonus = 500;

  if (activePlan === "premium") {
    kycReward = 750;
    premiumBonus = 1500;
  } else if (activePlan === "pro") {
    kycReward = 750;
    premiumBonus = 1000;
  }
  return { kycReward, premiumBonus };
}

// ----------------------------------------------------
// 6. Get Seller Referral Payout Receipts
// ----------------------------------------------------
export const getReferralPayoutReceipts = async (req, res) => {
  try {
    const seller = req.user;
    const referred = await Seller.find({
      referredBySellerId: seller._id
    }).sort({ createdAt: -1 });

    const { kycReward, premiumBonus } = getReferralRewardRates(seller);
    const payouts = [];

    referred.forEach((ref) => {
      if (ref.kycStatus === "approved") {
        payouts.push({
          id: `referral_${ref._id}_kyc`,
          label: `₹ ${kycReward} | ${formatDate(ref.createdAt)}`
        });
      }
      if (ref.sellerType === "premium" && ref.subscriptionActive === true) {
        payouts.push({
          id: `referral_${ref._id}_premium`,
          label: `₹ ${premiumBonus} | ${formatDate(ref.createdAt)}`
        });
      }
    });

    res.json({ success: true, payouts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 7. View/Download Referral Receipt by Payout
// ----------------------------------------------------
export const downloadReferralReceiptByPayout = async (req, res) => {
  try {
    const { payoutId, action } = req.query;
    if (!payoutId || !payoutId.startsWith("referral_")) {
      return res.status(400).json({ message: "Valid payoutId is required" });
    }

    const parts = payoutId.split("_");
    const referredId = parts[1];
    const type = parts[2]; // kyc or premium

    const seller = req.user;
    const referredSeller = await Seller.findOne({
      _id: referredId,
      referredBySellerId: seller._id
    });

    if (!referredSeller) {
      return res.status(404).json({ message: "Referral record not found." });
    }

    const { kycReward, premiumBonus } = getReferralRewardRates(seller);
    const amount = type === "kyc" ? kycReward : premiumBonus;

    const invoiceNumber = generateInvoiceNumber(seller.sellerId, referredSeller.createdAt);
    const filename = `referral_receipt_${referredSeller._id.toString().slice(-6)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    if (action === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    generateInvoiceHeader(doc, "REFERRAL EARNING RECEIPT", invoiceNumber, formatDate(referredSeller.createdAt));

    // Platform is paying the seller
    const platformIssuer = {
      businessName: "Funds And Toil Private Limited (Aashansh)",
      address: "Borivali",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400092",
      mobile: "+91 9867443283",
      email: "info@aashansh.org",
      panNumber: "AAACF8469C" // Mock PAN
    };

    generateBillingDetails(doc, platformIssuer, seller, true);

    const headers = [
      { key: "desc", label: "Reward Description", x: 50, width: 350, align: "left" },
      { key: "total", label: "Amount", x: 450, width: 100, align: "right" }
    ];

    const description = type === "kyc"
      ? `Referral Reward: KYC Approval of referred seller (${referredSeller.businessName || `${referredSeller.firstName} ${referredSeller.lastName}`})`
      : `Premium Bonus: Referred seller upgraded to Premium plan (${referredSeller.businessName || `${referredSeller.firstName} ${referredSeller.lastName}`})`;

    const rows = [
      {
        desc: description,
        total: `₹${amount.toFixed(2)}`
      }
    ];

    generateTable(doc, headers, rows, amount);

    generateFooter(doc, "Thank you for referring other sellers to Aashansh!");
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ----------------------------------------------------
// 8. View/Download Referral Receipt by Date Range
// ----------------------------------------------------
export const downloadReferralReceiptByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, action } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" });
    }

    const seller = req.user;
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const referred = await Seller.find({
      referredBySellerId: seller._id,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    const { kycReward, premiumBonus } = getReferralRewardRates(seller);
    const rows = [];
    let grandTotal = 0;

    referred.forEach((ref) => {
      if (ref.kycStatus === "approved") {
        rows.push({
          date: formatDate(ref.createdAt),
          desc: `KYC Approval: ${ref.businessName || `${ref.firstName} ${ref.lastName}`}`,
          total: `₹${kycReward.toFixed(2)}`
        });
        grandTotal += kycReward;
      }
      if (ref.sellerType === "premium" && ref.subscriptionActive === true) {
        rows.push({
          date: formatDate(ref.createdAt),
          desc: `Premium Bonus: ${ref.businessName || `${ref.firstName} ${ref.lastName}`}`,
          total: `₹${premiumBonus.toFixed(2)}`
        });
        grandTotal += premiumBonus;
      }
    });

    if (rows.length === 0) {
      return res.status(404).json({ message: "No referral earnings found in this date range." });
    }

    const invoiceDate = new Date();
    const invoiceNumber = generateInvoiceNumber(seller.sellerId, invoiceDate);
    const filename = `collective_referral_receipt_${formatDate(start)}_${formatDate(end)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    if (action === "download") {
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    } else {
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    generateInvoiceHeader(doc, "COLLECTIVE REFERRAL RECEIPT", invoiceNumber, formatDate(invoiceDate));

    const platformIssuer = {
      businessName: "Funds And Toil Private Limited (Aashansh)",
      address: "Borivali",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400092",
      mobile: "+91 9867443283",
      email: "info@aashansh.org",
      panNumber: "AAACF8469C"
    };

    generateBillingDetails(doc, platformIssuer, seller, true);

    const headers = [
      { key: "date", label: "Date", x: 50, width: 80, align: "left" },
      { key: "desc", label: "Referral Reward Description", x: 140, width: 270, align: "left" },
      { key: "total", label: "Amount", x: 420, width: 130, align: "right" }
    ];

    generateTable(doc, headers, rows, grandTotal);

    generateFooter(doc, `Collective Referral Receipts from ${formatDate(start)} to ${formatDate(end)}`);
    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
