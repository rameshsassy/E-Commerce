import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import CartAddEvent from "../models/CartAddEvent.js";

// @desc    Get user cart
// @route   GET /api/customer/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      populate: { path: "sellerId", select: "firstName lastName businessName" }
    });
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/customer/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity, selectedColor, selectedSize, purchaseType } = req.body;
    
    const product = await Product.findById(productId).populate("sellerId");
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const reqQuantity = quantity || 1;
    
    // Check product stock
    if (product.inventoryTracked !== false && !product.continueSellingWhenOutOfStock) {
      if (product.stock < reqQuantity) {
        return res.status(400).json({
          message: `Only ${product.stock} units available in stock.`,
        });
      }
    }

    const seller = product.sellerId;
    if (!seller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    const plan = seller.subscriptionPlan || "free";
    
    // Map purchaseType from client ("onetime", "subscription", "custom") to DB representation
    let normPurchaseType = "one_time";
    if (purchaseType === "subscription") normPurchaseType = "subscription";
    if (purchaseType === "custom" || purchaseType === "custom_order") normPurchaseType = "custom_order";

    // Validate purchase type against seller plan
    if (plan === "free" && normPurchaseType !== "one_time") {
      return res.status(403).json({
        message: "Subscription and custom purchase types are not allowed for free plan sellers.",
      });
    }
    if (plan === "pro" && normPurchaseType === "custom_order") {
      return res.status(403).json({
        message: "Custom order purchase type is not allowed for Pro plan sellers.",
      });
    }

    if (normPurchaseType === "subscription" || normPurchaseType === "custom_order") {
      if (product.purchaseType !== normPurchaseType) {
        return res.status(400).json({
          message: `Purchase type ${normPurchaseType} is not enabled for this product.`,
        });
      }
    }
    
    const maxAllowed = product.maxOrderQuantity ?? 5;
    const minAllowed = product.minOrderQuantity ?? 1;

    if (reqQuantity < minAllowed) {
      return res.status(400).json({
        message: `Minimum ${minAllowed} unit(s) required for this product.`,
      });
    }

    if (reqQuantity > maxAllowed) {
      return res.status(400).json({
        message: `Maximum ${maxAllowed} units allowed per product.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [{
          product: productId,
          quantity: reqQuantity,
          selectedColor: selectedColor || "",
          selectedSize: selectedSize || "",
          purchaseType: normPurchaseType
        }]
      });

      // Analytics event: product added to cart
      await CartAddEvent.create({
        userId: req.user._id,
        sellerId: product.sellerId?._id || product.sellerId,
        productId: product._id,
        quantity: reqQuantity,
        source: "cart",
      });
      
      const populatedCart = await Cart.findOne({ user: req.user._id }).populate({
        path: "items.product",
        populate: { path: "sellerId", select: "firstName lastName businessName" }
      });
      return res.status(201).json(populatedCart);
    }
    
    const itemIndex = cart.items.findIndex(item => 
      item.product.toString() === productId && 
      (item.selectedColor || "") === (selectedColor || "") &&
      (item.selectedSize || "") === (selectedSize || "") &&
      (item.purchaseType || "one_time") === normPurchaseType
    );
    
    if (itemIndex > -1) {
      // Update quantity
      const newQuantity = cart.items[itemIndex].quantity + reqQuantity;
      if (newQuantity > maxAllowed) {
        return res.status(400).json({
          message: `Maximum ${maxAllowed} units allowed per product. You already have some in your cart.`,
        });
      }
      cart.items[itemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity: reqQuantity,
        selectedColor: selectedColor || "",
        selectedSize: selectedSize || "",
        purchaseType: normPurchaseType
      });
    }
    
    await cart.save();

    // Analytics event: product added to cart
    await CartAddEvent.create({
      userId: req.user._id,
      sellerId: product.sellerId?._id || product.sellerId,
      productId: product._id,
      quantity: reqQuantity,
      source: "cart",
    });
    
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      populate: { path: "sellerId", select: "firstName lastName businessName" }
    });
    
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/customer/cart/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    
    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const maxAllowed = product.maxOrderQuantity ?? 5;
    const minAllowed = product.minOrderQuantity ?? 1;

    if (quantity < minAllowed) {
      return res.status(400).json({
        message: `Minimum ${minAllowed} unit(s) required for this product.`,
      });
    }

    if (quantity > maxAllowed) {
      return res.status(400).json({
        message: `Maximum ${maxAllowed} units allowed per product.`,
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = quantity;
      await cart.save();
      
      const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
        path: "items.product",
        populate: { path: "sellerId", select: "firstName lastName businessName" }
      });
      res.json(updatedCart);
    } else {
      res.status(404).json({ message: "Item not in cart" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/customer/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    
    await cart.save();
    
    const updatedCart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      populate: { path: "sellerId", select: "firstName lastName businessName" }
    });
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/customer/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
