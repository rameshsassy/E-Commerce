import Category from "../models/Category.js";

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
    const { name, description, image, icon, parentCategory, commissionRate, isActive, isFeatured } = req.body;
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const categoryExists = await Category.findOne({ slug });
    if (categoryExists) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    const category = new Category({
      name,
      slug,
      description,
      image,
      icon,
      parentCategory: parentCategory || null,
      commissionRate,
      isActive,
      isFeatured
    });

    await category.save();
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
    const { name, description, image, icon, parentCategory, commissionRate, isActive, isFeatured } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (name) {
      category.name = name;
      category.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;
    if (icon !== undefined) category.icon = icon;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (commissionRate !== undefined) category.commissionRate = commissionRate;
    if (isActive !== undefined) category.isActive = isActive;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;

    await category.save();
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

    // Optional: Check if products are tied to this category
    // For now we just delete it
    await Category.deleteOne({ _id: req.params.id });
    
    // Also delete or un-parent subcategories
    await Category.updateMany({ parentCategory: req.params.id }, { $set: { parentCategory: null } });

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
