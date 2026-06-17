import FeaturedProductLayout from "../models/FeaturedProductLayout.js";
import Product from "../models/Product.js";

// ─── Public APIs ─────────────────────────────────────────────────────────────

/** GET /api/featured-products — Fetch active layouts for Customer Panel */
export const getPublicFeaturedProducts = async (req, res) => {
  try {
    const layouts = await FeaturedProductLayout.find({ status: "active" })
      .sort({ displayOrder: 1, createdAt: -1 })
      .populate({
        path: "selectedProducts.productId",
        match: { isActive: true, approvalStatus: "approved" },
        populate: {
          path: "sellerId",
          select: "businessName firstName lastName",
        },
      });

    // Process and filter layouts
    const activeLayouts = layouts
      .map((layout) => {
        // Filter out any products that failed the Match criteria (e.g. inactive, deleted, draft)
        const validProducts = layout.selectedProducts
          .filter((item) => item.productId !== null && item.productId !== undefined)
          .map((item) => {
            const p = item.productId;
            const seller = p.sellerId || {};
            const sellerName = seller.businessName || `${seller.firstName || ""} ${seller.lastName || ""}`.trim() || "Unknown Seller";
            
            return {
              _id: p._id,
              name: p.title,
              title: p.title,
              images: p.images,
              price: p.price,
              mrp: p.compareAtPrice || p.price,
              compareAtPrice: p.compareAtPrice,
              stock: p.stock,
              category: p.category,
              averageRating: p.averageRating,
              totalReviews: p.totalReviews,
              sellerName: sellerName,
              displayOrder: item.displayOrder,
            };
          });

        // Sort products inside this layout by displayOrder ascending
        validProducts.sort((a, b) => a.displayOrder - b.displayOrder);

        return {
          _id: layout._id,
          title: layout.title,
          subtitle: layout.subtitle,
          layoutType: layout.layoutType,
          settings: layout.settings,
          displayOrder: layout.displayOrder,
          products: validProducts.slice(0, layout.settings?.maxProducts || 8),
        };
      })
      // Hide any layouts that don't have any valid active products
      .filter((layout) => layout.products.length > 0);

    res.json(activeLayouts);
  } catch (err) {
    console.error("getPublicFeaturedProducts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ─── Admin APIs ──────────────────────────────────────────────────────────────

/** GET /api/admin/products/search — Search active products for layout selection */
export const searchProducts = async (req, res) => {
  try {
    const queryStr = req.query.query || "";
    
    // Only search active and approved products
    const filter = {
      isActive: true,
      approvalStatus: "approved",
      isDraft: { $ne: true }
    };

    if (queryStr) {
      const regex = new RegExp(queryStr, "i");
      filter.$or = [{ title: regex }, { category: regex }, { keywords: regex }];
    }

    const products = await Product.find(filter)
      .limit(25)
      .populate("sellerId", "businessName firstName lastName");

    const mapped = products.map((p) => {
      const seller = p.sellerId || {};
      const sellerName = seller.businessName || `${seller.firstName || ""} ${seller.lastName || ""}`.trim() || "Unknown Seller";

      return {
        productId: p._id,
        productName: p.title,
        productImage: p.images?.[0] || "",
        sellerName,
        price: p.price,
        category: p.category,
        stock: p.stock,
        status: p.isActive ? "active" : "inactive",
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("searchProducts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** POST /api/admin/featured-products — Create layout (Super Admin / Admin) */
export const createLayout = async (req, res) => {
  try {
    const { title, subtitle, layoutType, selectedProducts, settings, status, displayOrder } = req.body;

    if (!title || !layoutType || !status) {
      return res.status(400).json({ message: "Title, layoutType, and status are required" });
    }

    const validTypes = ["grid", "carousel", "horizontal_scroll", "banner_products"];
    if (!validTypes.includes(layoutType)) {
      return res.status(400).json({ message: "Invalid layout type" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res.status(400).json({ message: "At least one product must be selected" });
    }

    // Validate product IDs, prevent duplicates and ensure products exist & are active
    const productIds = selectedProducts.map((p) => p.productId);
    const uniqueIds = new Set(productIds);
    if (uniqueIds.size !== productIds.length) {
      return res.status(400).json({ message: "Duplicate product selections are not allowed" });
    }

    const matchedProducts = await Product.find({
      _id: { $in: productIds },
      isActive: true,
      approvalStatus: "approved",
    });

    if (matchedProducts.length !== productIds.length) {
      return res.status(400).json({
        message: "Some selected products do not exist or are not active in the database",
      });
    }

    const layout = await FeaturedProductLayout.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : "",
      layoutType,
      selectedProducts,
      settings: settings || {},
      status,
      displayOrder: displayOrder ?? 0,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    res.status(201).json(layout);
  } catch (err) {
    console.error("createLayout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/admin/featured-products — List all layouts (Admin, paginated/filtered) */
export const getAllLayouts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const layoutType = req.query.layoutType;
    const status = req.query.status;

    const filter = {};
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ title: regex }, { subtitle: regex }];
    }
    if (layoutType) {
      filter.layoutType = layoutType;
    }
    if (status && ["active", "inactive"].includes(status)) {
      filter.status = status;
    }

    const [layouts, total] = await Promise.all([
      FeaturedProductLayout.find(filter)
        .sort({ displayOrder: 1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "selectedProducts.productId",
          select: "title images price stock category sellerId",
          populate: { path: "sellerId", select: "businessName firstName lastName" },
        })
        .populate("createdBy", "name firstName lastName")
        .populate("updatedBy", "name firstName lastName"),
      FeaturedProductLayout.countDocuments(filter),
    ]);

    res.json({
      layouts,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("getAllLayouts error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** GET /api/admin/featured-products/:id — Get details of single layout (Admin) */
export const getSingleLayout = async (req, res) => {
  try {
    const layout = await FeaturedProductLayout.findById(req.params.id)
      .populate({
        path: "selectedProducts.productId",
        select: "title images price stock category sellerId",
        populate: { path: "sellerId", select: "businessName firstName lastName" },
      })
      .populate("createdBy", "name firstName lastName")
      .populate("updatedBy", "name firstName lastName");

    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json(layout);
  } catch (err) {
    console.error("getSingleLayout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PUT /api/admin/featured-products/:id — Update layout (Admin) */
export const updateLayout = async (req, res) => {
  try {
    const { title, subtitle, layoutType, selectedProducts, settings, status, displayOrder } = req.body;

    const layout = await FeaturedProductLayout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    if (title !== undefined) layout.title = title.trim();
    if (subtitle !== undefined) layout.subtitle = subtitle ? subtitle.trim() : "";
    if (layoutType !== undefined) {
      const validTypes = ["grid", "carousel", "horizontal_scroll", "banner_products"];
      if (!validTypes.includes(layoutType)) {
        return res.status(400).json({ message: "Invalid layout type" });
      }
      layout.layoutType = layoutType;
    }

    if (selectedProducts !== undefined) {
      if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
        return res.status(400).json({ message: "At least one product must be selected" });
      }

      const productIds = selectedProducts.map((p) => p.productId);
      const uniqueIds = new Set(productIds);
      if (uniqueIds.size !== productIds.length) {
        return res.status(400).json({ message: "Duplicate product selections are not allowed" });
      }

      const matchedProducts = await Product.find({
        _id: { $in: productIds },
        isActive: true,
        approvalStatus: "approved",
      });

      if (matchedProducts.length !== productIds.length) {
        return res.status(400).json({
          message: "Some selected products do not exist or are not active in the database",
        });
      }
      layout.selectedProducts = selectedProducts;
    }

    if (settings !== undefined) layout.settings = settings;
    
    if (status !== undefined) {
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      layout.status = status;
    }

    if (displayOrder !== undefined) {
      const num = parseInt(displayOrder);
      if (isNaN(num)) {
        return res.status(400).json({ message: "Display order must be a valid number" });
      }
      layout.displayOrder = num;
    }

    layout.updatedBy = req.user._id;
    await layout.save();

    res.json(layout);
  } catch (err) {
    console.error("updateLayout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** DELETE /api/admin/featured-products/:id — Delete layout (Admin) */
export const deleteLayout = async (req, res) => {
  try {
    const layout = await FeaturedProductLayout.findByIdAndDelete(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }
    res.json({ message: "Layout deleted successfully" });
  } catch (err) {
    console.error("deleteLayout error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** PATCH /api/admin/featured-products/:id/status — Toggle status (Admin) */
export const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'active' or 'inactive'" });
    }

    const layout = await FeaturedProductLayout.findById(req.params.id);
    if (!layout) {
      return res.status(404).json({ message: "Layout not found" });
    }

    layout.status = status;
    layout.updatedBy = req.user._id;
    await layout.save();

    res.json(layout);
  } catch (err) {
    console.error("changeStatus error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
