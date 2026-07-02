import fs from "fs";
import path from "path";
import { createReadStream } from "fs";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import ImportLog from "../models/ImportLog.js";
import Customer from "../models/Customer.js";
import Seller from "../models/Seller.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Counter from "../models/Counter.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidPhone(phone) {
  const cleaned = String(phone || "").replace(/[\s\-\+]/g, "");
  return /^\d{10,15}$/.test(cleaned);
}

function isValidGST(gst) {
  if (!gst) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
    String(gst).toUpperCase()
  );
}

/** Generate next auto-incremented ID for a counter key */
async function getNextId(counterName, prefix) {
  const counter = await Counter.findOneAndUpdate(
    { name: counterName },
    { $inc: { sequenceValue: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}${counter.sequenceValue}`;
}

/**
 * Parse CSV or XLSX file into array of plain row objects.
 */
async function parseFile(filePath, mimetype) {
  const isExcel =
    mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimetype === "application/vnd.ms-excel" ||
    filePath.endsWith(".xlsx") ||
    filePath.endsWith(".xls");

  if (isExcel) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0];
    const rows = [];
    let headers = [];

    sheet.eachRow((row, rowNumber) => {
      const values = row.values.slice(1); // remove 1-indexed offset
      if (rowNumber === 1) {
        headers = values.map((v) => String(v || "").trim());
      } else {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] !== undefined && values[i] !== null ? String(values[i]).trim() : "";
        });
        // skip completely empty rows
        if (Object.values(obj).some((v) => v !== "")) rows.push(obj);
      }
    });
    return rows;
  }

  // CSV
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        if (Object.values(row).some((v) => String(v).trim() !== "")) rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

/**
 * Validate a single row – returns { valid: bool, errors: [] }
 */
function validateRow(row, importType, rowNum) {
  const errors = [];

  const req = (field) => {
    const val = row[field];
    if (!val || String(val).trim() === "") {
      errors.push({ row: rowNum, field, message: `${field} is required` });
    }
  };

  if (importType === "customers") {
    req("Email");
    if (row["Email"] && !isValidEmail(row["Email"])) {
      errors.push({ row: rowNum, field: "Email", message: "Invalid email format", data: row["Email"] });
    }
    if (row["Phone Number"] && !isValidPhone(row["Phone Number"])) {
      errors.push({ row: rowNum, field: "Phone Number", message: "Invalid phone number", data: row["Phone Number"] });
    }
  } else if (importType === "sellers") {
    req("Email");
    req("Seller Name");
    if (row["Email"] && !isValidEmail(row["Email"])) {
      errors.push({ row: rowNum, field: "Email", message: "Invalid email format", data: row["Email"] });
    }
    if (row["Phone Number"] && !isValidPhone(row["Phone Number"])) {
      errors.push({ row: rowNum, field: "Phone Number", message: "Invalid phone number", data: row["Phone Number"] });
    }
    if (row["GST Number"] && !isValidGST(row["GST Number"])) {
      errors.push({ row: rowNum, field: "GST Number", message: "Invalid GST format", data: row["GST Number"] });
    }
  } else if (importType === "products") {
    req("Product Name");
    req("Price");
    req("Category");
    if (row["Price"] && isNaN(Number(row["Price"]))) {
      errors.push({ row: rowNum, field: "Price", message: "Price must be a number", data: row["Price"] });
    }
  } else if (importType === "orders") {
    req("Customer Email");
    req("Order Number");
    req("Total Amount");
    if (row["Customer Email"] && !isValidEmail(row["Customer Email"])) {
      errors.push({ row: rowNum, field: "Customer Email", message: "Invalid email format", data: row["Customer Email"] });
    }
    if (row["Total Amount"] && isNaN(Number(row["Total Amount"]))) {
      errors.push({ row: rowNum, field: "Total Amount", message: "Total Amount must be a number", data: row["Total Amount"] });
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
// POST /api/superadmin/import/validate
// ─────────────────────────────────────────────
export const validateImportFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }
    const { importType } = req.body;
    if (!["customers", "sellers", "products", "orders"].includes(importType)) {
      return res.status(400).json({ message: "Invalid import type." });
    }

    const rows = await parseFile(req.file.path, req.file.mimetype);
    fs.unlink(req.file.path, () => {});

    const allErrors = [];
    let validCount = 0;
    let errorCount = 0;

    rows.forEach((row, i) => {
      const { valid, errors } = validateRow(row, importType, i + 2);
      if (valid) validCount++;
      else {
        errorCount++;
        allErrors.push(...errors);
      }
    });

    return res.json({
      totalRows: rows.length,
      validRows: validCount,
      errorRows: errorCount,
      preview: rows.slice(0, 20),
      errors: allErrors.slice(0, 100),
    });
  } catch (err) {
    console.error("[import/validate]", err);
    return res.status(500).json({ message: "Validation failed: " + err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/superadmin/import/customers
// ─────────────────────────────────────────────
export const importCustomers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const importMode = req.body.importMode || "skip_duplicates";
    const fileName = req.file.originalname || "import.csv";

    const rows = await parseFile(req.file.path, req.file.mimetype);
    fs.unlink(req.file.path, () => {});

    let importedRows = 0, skippedRows = 0, failedRows = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const { valid, errors: rowErrors } = validateRow(row, "customers", rowNum);
      if (!valid) { errors.push(...rowErrors); failedRows++; continue; }

      const email = String(row["Email"] || "").trim().toLowerCase();
      const existing = await Customer.findOne({ email });

      if (existing) {
        if (importMode === "skip_duplicates" || importMode === "import_new_only") {
          skippedRows++; continue;
        }
        if (importMode === "update_existing") {
          await Customer.updateOne({ email }, {
            $set: {
              firstName: row["First Name"] || existing.firstName,
              lastName: row["Last Name"] || existing.lastName,
              fullName: `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim() || existing.fullName,
              mobile: row["Phone Number"] || existing.mobile,
            },
          });
          importedRows++; continue;
        }
      }

      // Generate unique customerId
      const customerId = await getNextId("customerId", "CUST");
      const tempPassword = crypto.randomBytes(16).toString("hex");

      await Customer.create({
        customerId,
        firstName: String(row["First Name"] || "").trim(),
        lastName: String(row["Last Name"] || "").trim(),
        fullName: `${String(row["First Name"] || "").trim()} ${String(row["Last Name"] || "").trim()}`.trim(),
        email,
        mobile: String(row["Phone Number"] || "").trim(),
        password: await bcrypt.hash(tempPassword, 10),
        status: "approved",
        emailNewProductAlerts: true,
        marketingEmailsEnabled: true,
      });
      importedRows++;
    }

    const log = await ImportLog.create({
      importType: "customers",
      fileName,
      totalRows: rows.length,
      importedRows,
      skippedRows,
      failedRows,
      importedBy: req.user._id,
      importMode,
      status: "completed",
      errors: errors.slice(0, 500),
    });

    return res.json({ message: "Customer import completed.", totalRows: rows.length, importedRows, skippedRows, failedRows, logId: log._id, errors: errors.slice(0, 50) });
  } catch (err) {
    console.error("[import/customers]", err);
    return res.status(500).json({ message: "Import failed: " + err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/superadmin/import/sellers
// ─────────────────────────────────────────────
export const importSellers = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const importMode = req.body.importMode || "skip_duplicates";
    const fileName = req.file.originalname || "import.csv";

    const rows = await parseFile(req.file.path, req.file.mimetype);
    fs.unlink(req.file.path, () => {});

    let importedRows = 0, skippedRows = 0, failedRows = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const { valid, errors: rowErrors } = validateRow(row, "sellers", rowNum);
      if (!valid) { errors.push(...rowErrors); failedRows++; continue; }

      const email = String(row["Email"] || "").trim().toLowerCase();
      const existing = await Seller.findOne({ email });

      if (existing) {
        if (importMode === "skip_duplicates" || importMode === "import_new_only") {
          skippedRows++; continue;
        }
        if (importMode === "update_existing") {
          await Seller.updateOne({ email }, {
            $set: {
              fullName: row["Seller Name"] || existing.fullName,
              businessName: row["Business Name"] || existing.businessName,
              mobile: row["Phone Number"] || existing.mobile,
              city: row["City"] || existing.city,
              state: row["State"] || existing.state,
              address: row["Address"] || existing.address,
              pincode: row["Pincode"] || existing.pincode,
              gstNumber: row["GST Number"] || existing.gstNumber,
            },
          });
          importedRows++; continue;
        }
      }

      const sellerId = await getNextId("sellerId", "SELL");
      const tempPassword = crypto.randomBytes(16).toString("hex");

      const subscriptionPlan = ["free", "pro", "premium"].includes(row["Subscription Plan"])
        ? row["Subscription Plan"]
        : "free";

      await Seller.create({
        sellerId,
        fullName: String(row["Seller Name"] || "").trim(),
        businessName: String(row["Business Name"] || "").trim(),
        email,
        mobile: String(row["Phone Number"] || "").trim(),
        password: await bcrypt.hash(tempPassword, 10),
        address: String(row["Address"] || "").trim(),
        city: String(row["City"] || "").trim(),
        state: String(row["State"] || "").trim(),
        pincode: String(row["Pincode"] || "").trim(),
        gstNumber: String(row["GST Number"] || "").trim().toUpperCase(),
        subscriptionPlan,
        status: "pending",
        kycStatus: "not_submitted",
        sellerType: "free",
        agreedToTerms: false,
        isHyperlocal: false,
      });
      importedRows++;
    }

    const log = await ImportLog.create({
      importType: "sellers",
      fileName,
      totalRows: rows.length,
      importedRows,
      skippedRows,
      failedRows,
      importedBy: req.user._id,
      importMode,
      status: "completed",
      errors: errors.slice(0, 500),
    });

    return res.json({ message: "Seller import completed.", totalRows: rows.length, importedRows, skippedRows, failedRows, logId: log._id, errors: errors.slice(0, 50) });
  } catch (err) {
    console.error("[import/sellers]", err);
    return res.status(500).json({ message: "Import failed: " + err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/superadmin/import/products
// ─────────────────────────────────────────────
export const importProducts = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const importMode = req.body.importMode || "skip_duplicates";
    const fileName = req.file.originalname || "import.csv";

    const rows = await parseFile(req.file.path, req.file.mimetype);
    fs.unlink(req.file.path, () => {});

    let importedRows = 0, skippedRows = 0, failedRows = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const { valid, errors: rowErrors } = validateRow(row, "products", rowNum);
      if (!valid) { errors.push(...rowErrors); failedRows++; continue; }

      const sku = String(row["SKU"] || "").trim();

      // Resolve seller — required in Product schema
      let sellerId = null;
      if (row["Seller"] || row["Seller Email"]) {
        const sellerQuery = row["Seller Email"]
          ? { email: String(row["Seller Email"]).trim().toLowerCase() }
          : { fullName: String(row["Seller"]).trim() };
        const seller = await Seller.findOne(sellerQuery).select("_id");
        if (!seller) {
          errors.push({ row: rowNum, field: "Seller", message: `Seller not found: ${row["Seller"] || row["Seller Email"]}` });
          failedRows++; continue;
        }
        sellerId = seller._id;
      } else {
        errors.push({ row: rowNum, field: "Seller", message: "Seller is required to import a product (provide 'Seller' name or 'Seller Email' column)" });
        failedRows++; continue;
      }

      if (sku) {
        const existing = await Product.findOne({ sku });
        if (existing) {
          if (importMode === "skip_duplicates" || importMode === "import_new_only") { skippedRows++; continue; }
          if (importMode === "update_existing") {
            await Product.updateOne({ sku }, { $set: { title: row["Product Name"] || existing.title, price: Number(row["Price"]) || existing.price, stock: Number(row["Stock"]) || existing.stock } });
            importedRows++; continue;
          }
        }
      }

      // Use Product.create with schema-compatible fields
      const productData = {
        title: String(row["Product Name"] || "").trim(),
        description: String(row["Description"] || "").trim() || "Imported product",
        category: String(row["Category"] || "").trim() || "General",
        price: Number(row["Price"]) || 0,
        compareAtPrice: Number(row["Original Price"]) || Number(row["Price"]) || 0,
        stock: Number(row["Stock"]) || 0,
        sku: sku || `SKU-IMP-${Date.now()}-${i}`,
        approvalStatus: "pending",
        images: [],
        variants: [],
      };
      if (sellerId) productData.sellerId = sellerId;

      try {
        await Product.create(productData);
        importedRows++;
      } catch (createErr) {
        errors.push({ row: rowNum, field: "general", message: createErr.message });
        failedRows++;
      }
    }

    const log = await ImportLog.create({
      importType: "products",
      fileName,
      totalRows: rows.length,
      importedRows,
      skippedRows,
      failedRows,
      importedBy: req.user._id,
      importMode,
      status: "completed",
      errors: errors.slice(0, 500),
    });

    return res.json({ message: "Product import completed.", totalRows: rows.length, importedRows, skippedRows, failedRows, logId: log._id, errors: errors.slice(0, 50) });
  } catch (err) {
    console.error("[import/products]", err);
    return res.status(500).json({ message: "Import failed: " + err.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/superadmin/import/orders
// ─────────────────────────────────────────────
export const importOrders = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });
    const importMode = req.body.importMode || "skip_duplicates";
    const fileName = req.file.originalname || "import.csv";

    const rows = await parseFile(req.file.path, req.file.mimetype);
    fs.unlink(req.file.path, () => {});

    let importedRows = 0, skippedRows = 0, failedRows = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      const { valid, errors: rowErrors } = validateRow(row, "orders", rowNum);
      if (!valid) { errors.push(...rowErrors); failedRows++; continue; }

      // Find customer
      const customerEmail = String(row["Customer Email"] || "").trim().toLowerCase();
      const customer = await Customer.findOne({ email: customerEmail }).select("_id");
      if (!customer) {
        errors.push({ row: rowNum, field: "Customer Email", message: `Customer not found: ${customerEmail}` });
        failedRows++; continue;
      }

      // Check duplicate order number
      const orderNumber = String(row["Order Number"] || "").trim();
      // Orders don't have an orderNumber field in the schema, we'll skip duplicates based on razorpayOrderId
      const totalAmount = Number(row["Total Amount"]) || 0;

      try {
        await Order.create({
          user: customer._id,
          items: [],
          shippingAddress: { addressLine1: String(row["Shipping Address"] || "").trim() },
          itemsPrice: totalAmount,
          taxPrice: 0,
          shippingPrice: 0,
          totalAmount,
          paymentStatus: ["pending","completed","failed","refunded"].includes(row["Payment Status"]) ? row["Payment Status"] : "pending",
          isPaid: row["Payment Status"] === "completed",
          orderStatus: ["Processing","Packed","Shipped","Out for Delivery","Delivered","Cancelled"].includes(row["Order Status"]) ? row["Order Status"] : "Processing",
          razorpayOrderId: orderNumber || `IMP-${Date.now()}-${i}`,
        });
        importedRows++;
      } catch (createErr) {
        errors.push({ row: rowNum, field: "general", message: createErr.message });
        failedRows++;
      }
    }

    const log = await ImportLog.create({
      importType: "orders",
      fileName,
      totalRows: rows.length,
      importedRows,
      skippedRows,
      failedRows,
      importedBy: req.user._id,
      importMode,
      status: "completed",
      errors: errors.slice(0, 500),
    });

    return res.json({ message: "Order import completed.", totalRows: rows.length, importedRows, skippedRows, failedRows, logId: log._id, errors: errors.slice(0, 50) });
  } catch (err) {
    console.error("[import/orders]", err);
    return res.status(500).json({ message: "Import failed: " + err.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/superadmin/import/history
// ─────────────────────────────────────────────
export const getImportHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, importType } = req.query;
    const filter = {};
    if (importType && importType !== "all") filter.importType = importType;

    const logs = await ImportLog.find(filter)
      .populate("importedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await ImportLog.countDocuments(filter);
    return res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("[import/history]", err);
    return res.status(500).json({ message: "Failed to fetch history." });
  }
};

// ─────────────────────────────────────────────
// GET /api/superadmin/import/report/:id
// ─────────────────────────────────────────────
export const getImportReport = async (req, res) => {
  try {
    const log = await ImportLog.findById(req.params.id).populate("importedBy", "name email");
    if (!log) return res.status(404).json({ message: "Report not found." });
    return res.json(log);
  } catch (err) {
    console.error("[import/report]", err);
    return res.status(500).json({ message: "Failed to fetch report." });
  }
};

// ─────────────────────────────────────────────
// GET /api/superadmin/import/report/:id/download
// ─────────────────────────────────────────────
export const downloadErrorReport = async (req, res) => {
  try {
    const log = await ImportLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Report not found." });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Error Report");

    sheet.addRow(["Import ID", "Import Type", "File Name", "Total Rows", "Imported", "Skipped", "Failed", "Date"]);
    sheet.addRow([String(log._id), log.importType, log.fileName, log.totalRows, log.importedRows, log.skippedRows, log.failedRows, log.importedAt?.toISOString()]);
    sheet.addRow([]);
    sheet.addRow(["Row #", "Field", "Error Message", "Value"]);

    (log.errors || []).forEach((err) => {
      sheet.addRow([err.row, err.field, err.message, String(err.data || "")]);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=error-report-${log._id}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[import/download-report]", err);
    return res.status(500).json({ message: "Failed to generate report." });
  }
};

// ─────────────────────────────────────────────
// GET /api/superadmin/import/template/:type
// ─────────────────────────────────────────────
const TEMPLATES = {
  customers: ["First Name", "Last Name", "Email", "Phone Number", "Address", "City", "State", "Country", "Pincode", "Total Orders", "Total Spend", "Status"],
  sellers: ["Seller Name", "Business Name", "Email", "Phone Number", "Address", "City", "State", "Country", "Pincode", "GST Number", "Business Category", "Subscription Plan", "Store Name", "Store Handle", "Status"],
  products: ["Seller", "Product Name", "Description", "Category", "Sub Category", "Product Type", "Price", "Original Price", "Stock", "SKU", "Images", "Status"],
  orders: ["Customer Email", "Order Number", "Products", "Total Amount", "Payment Status", "Order Status", "Shipping Address", "Order Date"],
};

export const downloadTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    const headers = TEMPLATES[type];
    if (!headers) return res.status(400).json({ message: "Invalid template type." });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${type} Template`);
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } };
    headers.forEach((_, i) => {
      sheet.getColumn(i + 1).width = 20;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=${type}-sample-template.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("[import/template]", err);
    return res.status(500).json({ message: "Failed to generate template." });
  }
};
