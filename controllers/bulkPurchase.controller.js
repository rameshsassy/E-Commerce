import BulkPurchaseRequest from "../models/BulkPurchaseRequest.js";
import Product from "../models/Product.js";

export const createBulkPurchaseRequest = async (req, res) => {
  try {
    const { productId, sellerId, quantity, message } = req.body;

    if (!productId || !sellerId || !quantity) {
      return res.status(400).json({ message: "Product ID, Seller ID, and quantity are required." });
    }

    const product = await Product.findById(productId).populate("sellerId");
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const seller = product.sellerId;
    if (!seller) {
      return res.status(404).json({ message: "Seller not found." });
    }

    // Verify Seller is not Free
    const plan = seller.subscriptionPlan || "free";
    if (plan === "free") {
      return res.status(403).json({ message: "Bulk purchase requests are not available for free plan sellers." });
    }

    // Verify Bulk purchase is enabled on the product
    if (!product.bulkPurchaseEnabled) {
      return res.status(400).json({ message: "Bulk purchase is not enabled for this product." });
    }

    const request = new BulkPurchaseRequest({
      product: productId,
      seller: sellerId,
      customer: req.user._id,
      quantity: Number(quantity),
      message: message || "",
    });

    await request.save();

    res.status(201).json({ message: "Bulk purchase request submitted successfully", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
