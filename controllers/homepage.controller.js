import HomepageSetting from "../models/HomepageSetting.js";
import HeaderCategory from "../models/HeaderCategory.js";
import { absoluteToWebPath } from "../utils/uploadPaths.js";

// ===============================
// ⚙️ HOMEPAGE SETTINGS CONTROLLERS
// ===============================

// Fetch settings (Public)
export const getSettings = async (req, res) => {
  try {
    let settings = await HomepageSetting.findOne({ key: "header_settings" });
    if (!settings) {
      settings = new HomepageSetting({ key: "header_settings" });
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update settings (Super Admin Only)
export const updateSettings = async (req, res) => {
  try {
    const {
      logo,
      bulkPurchase,
      searchBar,
      cartIcon,
      accountMenu,
      announcementBar,
      heroBanner,
    } = req.body;

    let settings = await HomepageSetting.findOne({ key: "header_settings" });
    if (!settings) {
      settings = new HomepageSetting({ key: "header_settings" });
    }

    if (logo !== undefined) {
      if (logo.enabled !== undefined) settings.logo.enabled = logo.enabled;
      if (logo.url !== undefined) settings.logo.url = logo.url;
    }

    if (bulkPurchase !== undefined) {
      if (bulkPurchase.enabled !== undefined) settings.bulkPurchase.enabled = bulkPurchase.enabled;
      if (bulkPurchase.text !== undefined) settings.bulkPurchase.text = bulkPurchase.text;
      if (bulkPurchase.link !== undefined) settings.bulkPurchase.link = bulkPurchase.link;
    }

    if (searchBar !== undefined) {
      if (searchBar.enabled !== undefined) settings.searchBar.enabled = searchBar.enabled;
      if (searchBar.placeholder !== undefined) settings.searchBar.placeholder = searchBar.placeholder;
    }

    if (cartIcon !== undefined) {
      if (cartIcon.enabled !== undefined) settings.cartIcon.enabled = cartIcon.enabled;
    }

    if (accountMenu !== undefined) {
      if (accountMenu.enabled !== undefined) settings.accountMenu.enabled = accountMenu.enabled;
    }

    if (announcementBar !== undefined) {
      if (announcementBar.enabled !== undefined) settings.announcementBar.enabled = announcementBar.enabled;
      if (announcementBar.text !== undefined) settings.announcementBar.text = announcementBar.text;
      if (announcementBar.backgroundColor !== undefined) settings.announcementBar.backgroundColor = announcementBar.backgroundColor;
      if (announcementBar.textColor !== undefined) settings.announcementBar.textColor = announcementBar.textColor;
    }

    if (heroBanner !== undefined) {
      if (heroBanner.enabled !== undefined) settings.heroBanner.enabled = heroBanner.enabled;
      if (heroBanner.image !== undefined) settings.heroBanner.image = heroBanner.image;
      if (heroBanner.headlineEnabled !== undefined) settings.heroBanner.headlineEnabled = heroBanner.headlineEnabled;
      if (heroBanner.headline !== undefined) settings.heroBanner.headline = heroBanner.headline;
      if (heroBanner.headlineAlignment !== undefined) settings.heroBanner.headlineAlignment = heroBanner.headlineAlignment;
      if (heroBanner.subtitleEnabled !== undefined) settings.heroBanner.subtitleEnabled = heroBanner.subtitleEnabled;
      if (heroBanner.subtitle !== undefined) settings.heroBanner.subtitle = heroBanner.subtitle;
      if (heroBanner.ctaEnabled !== undefined) settings.heroBanner.ctaEnabled = heroBanner.ctaEnabled;
      if (heroBanner.ctaText !== undefined) settings.heroBanner.ctaText = heroBanner.ctaText;
      if (heroBanner.ctaLink !== undefined) settings.heroBanner.ctaLink = heroBanner.ctaLink;
      if (heroBanner.ctaColor !== undefined) settings.heroBanner.ctaColor = heroBanner.ctaColor;
    }

    await settings.save();
    res.json({ message: "Homepage settings updated successfully", settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Logo (Super Admin Only)
export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Logo image file is required" });
    }

    const webPath = absoluteToWebPath(req.file.path);

    let settings = await HomepageSetting.findOne({ key: "header_settings" });
    if (!settings) {
      settings = new HomepageSetting({ key: "header_settings" });
    }

    settings.logo.url = webPath;
    await settings.save();

    res.json({
      message: "Logo uploaded successfully",
      logoUrl: webPath,
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload Hero Image (Super Admin Only)
export const uploadHeroImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Hero image file is required" });
    }

    const webPath = absoluteToWebPath(req.file.path);

    let settings = await HomepageSetting.findOne({ key: "header_settings" });
    if (!settings) {
      settings = new HomepageSetting({ key: "header_settings" });
    }

    settings.heroBanner.image = webPath;
    await settings.save();

    res.json({
      message: "Hero image uploaded successfully",
      imageUrl: webPath,
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 🏷️ HEADER CATEGORY CONTROLLERS
// ===============================

// Fetch active categories (Public)
export const getHeaderCategories = async (req, res) => {
  try {
    const categories = await HeaderCategory.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Fetch all categories (Super Admin Only)
export const getAllHeaderCategories = async (req, res) => {
  try {
    const categories = await HeaderCategory.find().sort({ displayOrder: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create category (Super Admin Only)
export const createHeaderCategory = async (req, res) => {
  try {
    const { name, slug, icon, isActive, displayOrder } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    if (!slug || !String(slug).trim()) {
      return res.status(400).json({ message: "Category slug is required" });
    }

    const category = new HeaderCategory({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      icon: icon ? icon.trim() : "",
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: Number(displayOrder) || 0,
    });

    await category.save();
    res.status(201).json({ message: "Header category created successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category (Super Admin Only)
export const updateHeaderCategory = async (req, res) => {
  try {
    const { name, slug, icon, isActive, displayOrder } = req.body;

    const category = await HeaderCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Header category not found" });
    }

    if (name !== undefined) category.name = name.trim();
    if (slug !== undefined) category.slug = slug.trim().toLowerCase();
    if (icon !== undefined) category.icon = icon.trim();
    if (isActive !== undefined) category.isActive = isActive;
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder) || 0;

    await category.save();
    res.json({ message: "Header category updated successfully", category });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category (Super Admin Only)
export const deleteHeaderCategory = async (req, res) => {
  try {
    const category = await HeaderCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Header category not found" });
    }

    await HeaderCategory.deleteOne({ _id: req.params.id });
    res.json({ message: "Header category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reorder categories in bulk (Super Admin Only)
export const reorderHeaderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, displayOrder }

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: "Invalid categories array" });
    }

    const bulkOps = categories.map((c) => ({
      updateOne: {
        filter: { _id: c.id },
        update: { $set: { displayOrder: c.displayOrder } },
      },
    }));

    if (bulkOps.length > 0) {
      await HeaderCategory.bulkWrite(bulkOps);
    }

    res.json({ message: "Header categories reordered successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
