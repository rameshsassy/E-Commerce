import Category from "../models/Category.js";
import HeaderCategory from "../models/HeaderCategory.js";
import Product from "../models/Product.js";

const buildSlug = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

// ===============================
// 📋 GET ALL CATEGORIES
// ===============================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parentCategory", "name slug");
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🔍 GET SINGLE CATEGORY
// ===============================
export const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate("parentCategory", "name slug");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ➕ CREATE CATEGORY (Admin Only)
// ===============================
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, icon, parentCategory, subCategory, productType, commissionRate, isActive, isFeatured } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const slug = buildSlug(name);
    if (!slug) {
      return res.status(400).json({ message: "Category name is invalid" });
    }

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    let resolvedParentCategory = parentCategory || null;
    if (parentCategory === "other") {
      if (!req.body.customParentCategory || !String(req.body.customParentCategory).trim()) {
        return res.status(400).json({ message: "Custom parent category name is required when choosing 'Other'" });
      }
      const customName = String(req.body.customParentCategory).trim();
      const parentSlug = buildSlug(customName);
      if (!parentSlug) {
        return res.status(400).json({ message: "Custom parent category name is invalid" });
      }
      let existingParent = await Category.findOne({ slug: parentSlug });
      if (!existingParent) {
        existingParent = new Category({
          name: customName,
          slug: parentSlug,
          commissionRate: 5,
          isActive: true,
          parentCategory: null,
          subCategory: null,
          productType: null
        });
        await existingParent.save();
      }
      resolvedParentCategory = existingParent._id;
    } else if (parentCategory) {
      const parentExists = await Category.exists({ _id: parentCategory });
      if (!parentExists) {
        return res.status(400).json({ message: "Selected parent category does not exist" });
      }
    }

    let resolvedSubCategory = subCategory || null;
    if (subCategory === "other") {
      if (!req.body.customSubCategory || !String(req.body.customSubCategory).trim()) {
        return res.status(400).json({ message: "Custom subcategory name is required when choosing 'Other'" });
      }
      resolvedSubCategory = String(req.body.customSubCategory).trim();
    }

    let resolvedProductType = productType || null;
    if (productType === "other") {
      if (!req.body.customProductType || !String(req.body.customProductType).trim()) {
        return res.status(400).json({ message: "Custom product type is required when choosing 'Other'" });
      }
      resolvedProductType = String(req.body.customProductType).trim();
    }

    const category = new Category({
      name,
      slug,
      description,
      image,
      icon,
      parentCategory: resolvedParentCategory,
      subCategory: resolvedSubCategory,
      productType: resolvedProductType,
      commissionRate,
      isActive,
      isFeatured
    });

    await category.save();

    // Sync with HeaderCategory for Homepage/Header navigation
    try {
      const existingHeaderCat = await HeaderCategory.findOne({ slug });
      if (!existingHeaderCat) {
        const headerCategory = new HeaderCategory({
          name: name.trim(),
          slug: slug,
          icon: icon ? icon.trim() : "",
          isActive: isActive !== undefined ? isActive : true,
          displayOrder: 0
        });
        await headerCategory.save();
      } else {
        existingHeaderCat.name = name.trim();
        existingHeaderCat.isActive = isActive !== undefined ? isActive : true;
        if (icon !== undefined) existingHeaderCat.icon = icon ? icon.trim() : "";
        await existingHeaderCat.save();
      }
    } catch (syncError) {
      console.error("Failed to sync header category on creation:", syncError);
    }

    res.status(201).json({ message: "Category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE CATEGORY (Admin Only)
// ===============================
export const updateCategory = async (req, res) => {
  try {
    const { name, description, image, icon, parentCategory, subCategory, productType, commissionRate, isActive, isFeatured } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldSlug = category.slug;
    const oldName = category.name;

    if (name) {
      const nextSlug = buildSlug(name);
      if (!nextSlug) {
        return res.status(400).json({ message: "Category name is invalid" });
      }
      const duplicate = await Category.findOne({
        slug: nextSlug,
        _id: { $ne: category._id },
      });
      if (duplicate) {
        return res.status(400).json({ message: "Category with this name already exists" });
      }
      category.name = name;
      category.slug = nextSlug;
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (parentCategory !== undefined) {
      let resolvedParentCategory = parentCategory || null;
      if (parentCategory === "other") {
        if (!req.body.customParentCategory || !String(req.body.customParentCategory).trim()) {
          return res.status(400).json({ message: "Custom parent category name is required when choosing 'Other'" });
        }
        const customName = String(req.body.customParentCategory).trim();
        const parentSlug = buildSlug(customName);
        if (!parentSlug) {
          return res.status(400).json({ message: "Custom parent category name is invalid" });
        }
        let existingParent = await Category.findOne({ slug: parentSlug });
        if (!existingParent) {
          existingParent = new Category({
            name: customName,
            slug: parentSlug,
            commissionRate: 5,
            isActive: true,
            parentCategory: null,
            subCategory: null,
            productType: null
          });
          await existingParent.save();
        }
        resolvedParentCategory = existingParent._id;
      }

      if (resolvedParentCategory && String(resolvedParentCategory) === String(category._id)) {
        return res.status(400).json({ message: "A category cannot be its own parent" });
      }
      if (resolvedParentCategory && parentCategory !== "other") {
        const parentExists = await Category.exists({ _id: resolvedParentCategory });
        if (!parentExists) {
          return res.status(400).json({ message: "Selected parent category does not exist" });
        }
      }
      category.parentCategory = resolvedParentCategory;
    }
    if (subCategory !== undefined) {
      let resolvedSubCategory = subCategory || null;
      if (subCategory === "other") {
        if (!req.body.customSubCategory || !String(req.body.customSubCategory).trim()) {
          return res.status(400).json({ message: "Custom subcategory name is required when choosing 'Other'" });
        }
        resolvedSubCategory = String(req.body.customSubCategory).trim();
      }
      category.subCategory = resolvedSubCategory;
    }
    if (productType !== undefined) {
      let resolvedProductType = productType || null;
      if (productType === "other") {
        if (!req.body.customProductType || !String(req.body.customProductType).trim()) {
          return res.status(400).json({ message: "Custom product type is required when choosing 'Other'" });
        }
        resolvedProductType = String(req.body.customProductType).trim();
      }
      category.productType = resolvedProductType;
    }
    if (commissionRate !== undefined) category.commissionRate = commissionRate;
    if (isActive !== undefined) category.isActive = isActive;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;

    await category.save();

    // Sync with HeaderCategory
    try {
      const headerCategory = await HeaderCategory.findOne({ slug: oldSlug });
      if (headerCategory) {
        if (name) {
          headerCategory.name = name.trim();
          headerCategory.slug = category.slug;
        }
        if (icon !== undefined) headerCategory.icon = icon ? icon.trim() : "";
        if (isActive !== undefined) headerCategory.isActive = isActive;
        await headerCategory.save();
      } else {
        const newHeaderCategory = new HeaderCategory({
          name: category.name,
          slug: category.slug,
          icon: category.icon ? category.icon.trim() : "",
          isActive: category.isActive,
          displayOrder: 0
        });
        await newHeaderCategory.save();
      }
    } catch (syncError) {
      console.error("Failed to sync header category on update:", syncError);
    }

    // Sync associated products
    try {
      if (name && oldName !== category.name) {
        await Product.updateMany({ category: oldName }, { $set: { category: category.name } });
      }
    } catch (productSyncError) {
      console.error("Failed to sync products on category rename:", productSyncError);
    }

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ DELETE CATEGORY (Admin Only)
// ===============================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const oldSlug = category.slug;
    const oldName = category.name;

    // Optional: Check if products are tied to this category
    // For now we just delete it
    await Category.deleteOne({ _id: req.params.id });
    
    // Also delete or un-parent subcategories
    await Category.updateMany({ parentCategory: req.params.id }, { $set: { parentCategory: null } });

    // Sync deletion to HeaderCategory
    try {
      await HeaderCategory.deleteOne({ slug: oldSlug });
    } catch (syncError) {
      console.error("Failed to delete header category on deletion:", syncError);
    }

    // Sync associated products
    try {
      await Product.updateMany({ category: oldName }, { $set: { category: "Uncategorized" } });
    } catch (productSyncError) {
      console.error("Failed to sync products on category deletion:", productSyncError);
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
