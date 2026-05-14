import Product from "../models/Product.js";
import fs from "fs";
import csv from "csv-parser";
import sanitizeHtml from "sanitize-html";
import sharp from "sharp";

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const sanitizeDescription = (html) => {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'strong', 'em', 'u', 'p', 'div', 'br', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      '*': ['style', 'class', 'align'],
    },
    allowedStyles: {
      '*': {
        'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      }
    }
  });
};

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

    const { title, description, price, compareAtPrice, unitPrice, chargeTax, stock, locations, category, keywords, inventoryTracked, sku, barcode, continueSellingWhenOutOfStock, isPhysicalProduct, packageType, packageLength, packageWidth, packageHeight, packageDimensionsUnit, productWeight, productWeightUnit, pageTitle, metaDescription, urlHandle } = req.body;

    const categoryValue =
      category != null && String(category).trim() !== ""
        ? String(category).trim()
        : "Uncategorized";

    if (!title || !description || !price) {
      return res.status(400).json({
        message: "Title, description, and price are required",
      });
    }

    // 🖼️ Images
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = req.files.map((file) => file.path);
      
      for (const filePath of imagePaths) {
        try {
          let quality = 80;
          let buffer = await sharp(filePath)
            .resize(800, 800, { fit: 'cover', position: 'center' })
            .jpeg({ quality })
            .toBuffer();
            
          while (buffer.length > 100 * 1024 && quality > 10) {
            quality -= 10;
            buffer = await sharp(filePath)
              .resize(800, 800, { fit: 'cover', position: 'center' })
              .jpeg({ quality })
              .toBuffer();
          }
          fs.writeFileSync(filePath, buffer);
        } catch (err) {
          console.error("Image processing error:", err);
        }
      }
    }

    // 🔍 Keywords
    let keywordArray = [];
    if (typeof keywords === "string" && keywords.trim() !== "") {
      keywordArray = keywords.split(",").map((k) => k.trim()).filter(Boolean);
    } else if (Array.isArray(keywords)) {
      keywordArray = keywords.filter(Boolean);
    }

    let parsedLocations = [];
    if (locations) {
      try {
        parsedLocations = JSON.parse(locations);
      } catch (e) {
        if (Array.isArray(locations)) parsedLocations = locations;
      }
    }
    
    // Filter and sanitize locations
    if (parsedLocations.length > 0) {
      parsedLocations = parsedLocations
        .filter(loc => loc.address && loc.address.trim() !== "")
        .map(loc => ({
          address: loc.address,
          stock: Number(loc.stock) || 0
        }));
    }
    
    let totalStock = Number(stock) || 0;
    if (parsedLocations.length > 0) {
      totalStock = parsedLocations.reduce((sum, loc) => sum + loc.stock, 0);
    } else {
      parsedLocations = [{ address: "Main Shop Location", stock: totalStock }];
    }

    const product = await Product.create({
      sellerId: req.user._id,
      title,
      description: sanitizeDescription(description),
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      unitPrice: unitPrice ? Number(unitPrice) : undefined,
      chargeTax: chargeTax === 'true' || chargeTax === true,
      stock: totalStock,
      locations: parsedLocations,
      inventoryTracked: inventoryTracked === 'true' || inventoryTracked === true,
      sku: sku || "",
      barcode: barcode || "",
      continueSellingWhenOutOfStock: continueSellingWhenOutOfStock === 'true' || continueSellingWhenOutOfStock === true,
      isPhysicalProduct: isPhysicalProduct === undefined ? true : (isPhysicalProduct === 'true' || isPhysicalProduct === true),
      packageType: packageType || "Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg",
      packageLength: packageLength ? Number(packageLength) : undefined,
      packageWidth: packageWidth ? Number(packageWidth) : undefined,
      packageHeight: packageHeight ? Number(packageHeight) : undefined,
      packageDimensionsUnit: packageDimensionsUnit || "cm",
      productWeight: productWeight ? Number(productWeight) : 0,
      productWeightUnit: productWeightUnit || "g",
      pageTitle: pageTitle || title.substring(0, 70),
      metaDescription: metaDescription || "",
      urlHandle: urlHandle || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      category: categoryValue,
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
      seller,
      sort,
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

    // 🧑‍💼 SELLER FILTER
    if (seller) {
      query.sellerId = seller;
    }

    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // 🔄 SORTING LOGIC
    let sortObj = { createdAt: -1 }; // newest default
    if (sort === "price-low") sortObj = { price: 1 };
    if (sort === "price-high") sortObj = { price: -1 };
    if (sort === "newest") sortObj = { createdAt: -1 };
    // if (sort === "best-selling") sortObj = { soldCount: -1 }; // Future use when soldCount exists
    // if (sort === "highest-rated") sortObj = { averageRating: -1 }; // Future use for ratings

    // 🔥 IMPORTANT: enforce KYC here
    const products = await Product.find(query)
      .populate({
        path: "sellerId",
        match: { status: "approved" }, // ✅ KYC must be approved
        select: "firstName lastName businessName email",
      })
      .sort(sortObj)
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

    const rows = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        if (!row.title || !row.price || !row.category) return;
        rows.push(row);
      })
      .on("end", async () => {
        if (rows.length === 0) {
          return res.status(400).json({
            message: "No valid products found in CSV",
          });
        }

        const products = [];

        for (const row of rows) {
          let localImagePaths = [];
          
          if (row.imageLinks) {
            const urls = row.imageLinks.split(",").map(url => url.trim()).filter(url => url);
            for (const url of urls) {
              try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
                
                const arrayBuffer = await response.arrayBuffer();
                let buffer = Buffer.from(arrayBuffer);
                
                const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + '.jpg';
                const filePath = 'uploads/' + filename; 
                
                let quality = 80;
                let processedBuffer = await sharp(buffer)
                  .resize(800, 800, { fit: 'cover', position: 'center' })
                  .jpeg({ quality })
                  .toBuffer();
                  
                while (processedBuffer.length > 100 * 1024 && quality > 10) {
                  quality -= 10;
                  processedBuffer = await sharp(buffer)
                    .resize(800, 800, { fit: 'cover', position: 'center' })
                    .jpeg({ quality })
                    .toBuffer();
                }
                
                fs.writeFileSync(filePath, processedBuffer);
                localImagePaths.push(filePath);
              } catch (err) {
                console.error("Failed to process image from URL:", url, err.message);
              }
            }
          }

          products.push({
            sellerId: req.user._id,
            title: row.title,
            description: row.description || "",
            price: Number(row.price),
            stock: Number(row.stock || 0),
            category: row.category,
            keywords: row.keywords ? row.keywords.split(",") : [],
            images: localImagePaths,
            approvalStatus: "pending",
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
      select:
        "firstName lastName businessName email mobile sellerType subscriptionActive bulkPurchaseEnabled",
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

    const { title, description, price, compareAtPrice, unitPrice, chargeTax, stock, locations, category, keywords, inventoryTracked, sku, barcode, continueSellingWhenOutOfStock, isPhysicalProduct, packageType, packageLength, packageWidth, packageHeight, packageDimensionsUnit, productWeight, productWeightUnit, pageTitle, metaDescription, urlHandle } = req.body;

    product.title = title || product.title;
    if (description !== undefined) {
      product.description = sanitizeDescription(description);
    }
    product.price = price || product.price;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice ? Number(compareAtPrice) : undefined;
    if (unitPrice !== undefined) product.unitPrice = unitPrice ? Number(unitPrice) : undefined;
    if (chargeTax !== undefined) product.chargeTax = chargeTax === 'true' || chargeTax === true;
    
    if (locations !== undefined) {
      let parsedLocations = [];
      try {
        parsedLocations = typeof locations === 'string' ? JSON.parse(locations) : locations;
      } catch (e) {
        if (Array.isArray(locations)) parsedLocations = locations;
      }
      
      parsedLocations = parsedLocations
        .filter(loc => loc.address && loc.address.trim() !== "")
        .map(loc => ({
          address: loc.address,
          stock: Number(loc.stock) || 0
        }));
        
      product.locations = parsedLocations;
      product.stock = parsedLocations.reduce((sum, loc) => sum + loc.stock, 0);
    } else if (stock !== undefined) {
      product.stock = stock;
    }

    if (inventoryTracked !== undefined) product.inventoryTracked = inventoryTracked === 'true' || inventoryTracked === true;
    if (sku !== undefined) product.sku = sku;
    if (barcode !== undefined) product.barcode = barcode;
    if (continueSellingWhenOutOfStock !== undefined) product.continueSellingWhenOutOfStock = continueSellingWhenOutOfStock === 'true' || continueSellingWhenOutOfStock === true;
    if (isPhysicalProduct !== undefined) product.isPhysicalProduct = isPhysicalProduct === 'true' || isPhysicalProduct === true;
    if (packageType !== undefined) product.packageType = packageType;
    if (packageLength !== undefined) product.packageLength = packageLength ? Number(packageLength) : undefined;
    if (packageWidth !== undefined) product.packageWidth = packageWidth ? Number(packageWidth) : undefined;
    if (packageHeight !== undefined) product.packageHeight = packageHeight ? Number(packageHeight) : undefined;
    if (packageDimensionsUnit !== undefined) product.packageDimensionsUnit = packageDimensionsUnit;
    if (productWeight !== undefined) product.productWeight = Number(productWeight);
    if (productWeightUnit !== undefined) product.productWeightUnit = productWeightUnit;
    if (pageTitle !== undefined) product.pageTitle = pageTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;
    if (urlHandle !== undefined) product.urlHandle = urlHandle;
    if (category !== undefined) {
      product.category =
        String(category).trim() !== "" ? String(category).trim() : "Uncategorized";
    }

    if (keywords) {
      if (typeof keywords === "string" && keywords.trim() !== "") {
        product.keywords = keywords.split(",").map((k) => k.trim()).filter(Boolean);
      } else if (Array.isArray(keywords)) {
        product.keywords = keywords.filter(Boolean);
      } else {
        product.keywords = [];
      }
    }

    // Handle new images if any are uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file) => file.path);
      
      for (const filePath of newImages) {
        try {
          let quality = 80;
          let buffer = await sharp(filePath)
            .resize(800, 800, { fit: 'cover', position: 'center' })
            .jpeg({ quality })
            .toBuffer();
            
          while (buffer.length > 100 * 1024 && quality > 10) {
            quality -= 10;
            buffer = await sharp(filePath)
              .resize(800, 800, { fit: 'cover', position: 'center' })
              .jpeg({ quality })
              .toBuffer();
          }
          fs.writeFileSync(filePath, buffer);
        } catch (err) {
          console.error("Image processing error:", err);
        }
      }
      
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

// ===============================
// 📍 CHECK PINCODE SERVICEABILITY
// ===============================
export const checkPincode = async (req, res) => {
  try {
    const { pincode } = req.query;
    if (!pincode) {
      return res.status(400).json({ message: "Pincode is required" });
    }

    const product = await Product.findById(req.params.id).populate({
      path: "sellerId",
      select: "isHyperlocal deliverablePincodes",
    });

    if (!product || !product.sellerId) {
      return res.status(404).json({ message: "Product or seller not found" });
    }

    const seller = product.sellerId;

    if (!seller.isHyperlocal) {
      // Seller delivers everywhere
      return res.json({ 
        serviceable: true, 
        message: "Delivery available to this pincode." 
      });
    }

    const isDeliverable = seller.deliverablePincodes.includes(pincode.trim());

    if (isDeliverable) {
      return res.json({ 
        serviceable: true, 
        message: "Delivery available to this pincode." 
      });
    } else {
      return res.json({ 
        serviceable: false, 
        message: `Currently not delivering to ${pincode}.` 
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};