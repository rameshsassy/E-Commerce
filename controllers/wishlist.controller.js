import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// @desc    Get user wishlist
// @route   GET /api/customer/wishlist
// @access  Private
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle product in wishlist (add/remove)
// @route   POST /api/customer/wishlist/toggle
// @access  Private
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [productId] });
      return res.status(201).json(wishlist);
    }
    
    const isProductInWishlist = wishlist.products.includes(productId);
    
    if (isProductInWishlist) {
      // Remove
      wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    } else {
      // Add
      wishlist.products.push(productId);
    }
    
    await wishlist.save();
    
    const updatedWishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
    res.json(updatedWishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
