import Menu from "../models/Menu.js";

// ===============================
// 🌐 GET ACTIVE MENU ITEMS (Public)
// ===============================
export const getMenuItems = async (req, res) => {
  try {
    const menuItems = await Menu.find({ isActive: true }).sort({ order: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 📋 GET ALL MENU ITEMS (Admin)
// ===============================
export const getAllMenuItems = async (req, res) => {
  try {
    const menuItems = await Menu.find().sort({ order: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ➕ CREATE MENU ITEM (Admin Only)
// ===============================
export const createMenuItem = async (req, res) => {
  try {
    const { name, link, order, isActive } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Menu item name is required" });
    }
    if (!link || !String(link).trim()) {
      return res.status(400).json({ message: "Menu item link is required" });
    }

    const menuExists = await Menu.findOne({ name: name.trim() });
    if (menuExists) {
      return res.status(400).json({ message: "Menu item with this name already exists" });
    }

    const menuItem = new Menu({
      name: name.trim(),
      link: link.trim(),
      order: Number(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    await menuItem.save();
    res.status(201).json({ message: "Menu item created successfully", menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ✏️ UPDATE MENU ITEM (Admin Only)
// ===============================
export const updateMenuItem = async (req, res) => {
  try {
    const { name, link, order, isActive } = req.body;

    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    if (name && name.trim() !== menuItem.name) {
      const duplicate = await Menu.findOne({ name: name.trim(), _id: { $ne: menuItem._id } });
      if (duplicate) {
        return res.status(400).json({ message: "Menu item with this name already exists" });
      }
      menuItem.name = name.trim();
    }

    if (link !== undefined) menuItem.link = link.trim();
    if (order !== undefined) menuItem.order = Number(order) || 0;
    if (isActive !== undefined) menuItem.isActive = isActive;

    await menuItem.save();
    res.json({ message: "Menu item updated successfully", menuItem });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// ❌ DELETE MENU ITEM (Admin Only)
// ===============================
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await Menu.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    await Menu.deleteOne({ _id: req.params.id });
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
