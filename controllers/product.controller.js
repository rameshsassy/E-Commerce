import Product from "../models/Product.js";
import fs from "fs";
import csv from "csv-parser";

// ===============================
// ➕ ADD PRODUCT (WITH APPROVAL)
// ===============================
export const addProduct = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Complete KYC and get approval to add products",
      });
    }

    const { title, description, price, stock, category, keywords } = req.body;

    if (!title || !description || !price || !category) {
      return res.status(400).json({
        message: "Title, description, price, and category are required",
      });
    }

    // 🖼️ Images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) => file.path);
    }

    // 🔍 Keywords
    let keywordArray = [];
    if (typeof keywords === "string") {
      keywordArray = keywords.split(",").map((k) => k.trim());
    } else if (Array.isArray(keywords)) {
      keywordArray = keywords;
    }

    const product = await Product.create({
      sellerId: req.user._id,
      title,
      description,
      price,
      stock: stock || 0,
      category,
      keywords: keywordArray,
      images: imagePaths,
      approvalStatus: "pending",
    });

    res.status(201).json({
      message: "Product submitted for admin approval",
      product,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET ALL PRODUCTS (FULL FIX)
// ===============================
export const getAllProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {
      sellerId: { $ne: null },
      isActive: true,
      approvalStatus: "approved",
    };

    // 🔍 SEARCH
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { keywords: { $regex: keyword, $options: "i" } },
      ];
    }

    // 📂 CATEGORY
    if (category) {
      query.category = category;
    }

    // 💰 PRICE FILTER
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // 🔥 IMPORTANT: enforce KYC here
    const products = await Product.find(query)
      .populate({
        path: "sellerId",
        match: { status: "approved" }, // ✅ KYC must be approved
        select: "firstName email",
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // ❗ Remove products with invalid sellers
    const filteredProducts = products.filter(
      (p) => p.sellerId !== null
    );

    const total = await Product.countDocuments(query);

    res.json({
      total,
      page: pageNumber,
      pages: Math.ceil(total / limitNumber),
      count: filteredProducts.length,
      products: filteredProducts,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 BULK UPLOAD PRODUCTS (FIXED)
// ===============================
export const bulkUploadProducts = async (req, res) => {
  try {
    if (req.user.status !== "approved") {
      return res.status(403).json({
        message: "Not approved seller",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "CSV file required",
      });
    }

    const products = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        if (!row.title || !row.price || !row.category) return;

        products.push({
          sellerId: req.user._id,
          title: row.title,
          description: row.description || "",
          price: Number(row.price),
          stock: Number(row.stock || 0),
          category: row.category,
          keywords: row.keywords ? row.keywords.split(",") : [],
          approvalStatus: "pending",
        });
      })
      .on("end", async () => {
        if (products.length === 0) {
          return res.status(400).json({
            message: "No valid products found in CSV",
          });
        }

        await Product.insertMany(products);

        // 🧹 Cleanup uploaded CSV file
        fs.unlinkSync(req.file.path);

        res.json({
          message: "Bulk upload successful",
          count: products.length,
        });
      })
      .on("error", (err) => {
        res.status(500).json({
          message: "CSV processing failed",
          error: err.message,
        });
      });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📦 GET PRODUCT BY ID (NEW)
// ===============================
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: "sellerId",
      select: "firstName lastName businessName email",
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!product.isActive || product.approvalStatus !== "approved") {
      return res.status(404).json({ message: "Product not available" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE PRODUCT (SELLER ONLY)
// ===============================
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this product" });
    }

    const { title, description, price, stock, category, keywords } = req.body;

    product.title = title || product.title;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.category = category || product.category;

    if (keywords) {
      if (typeof keywords === "string") {
        product.keywords = keywords.split(",").map((k) => k.trim());
      } else if (Array.isArray(keywords)) {
        product.keywords = keywords;
      }
    }

    // Handle new images if any are uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      product.images = newImages; // Replace old images with new ones
    }

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🗑️ DELETE PRODUCT (SELLER ONLY)
// ===============================
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};