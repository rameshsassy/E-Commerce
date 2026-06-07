import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Shipment from "../models/Shipment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendNotificationToUser } from "../utils/socket.js";
import { generateDisplayOrderId } from "../utils/orderDisplayId.js";

// @desc    Get all active products from other sellers
// @route   GET /api/seller/buy-products
// @access  Private (Seller only)
export const getBuyProducts = async (req, res) => {
  try {
    const currentSellerId = req.user._id;

    // Find products that are active, approved, and belong to other sellers
    const products = await Product.find({
      sellerId: { $ne: currentSellerId },
      isActive: true,
      approvalStatus: "approved"
    })
      .populate("sellerId", "firstName lastName businessName sellerType")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase products: " + error.message
    });
  }
};

// @desc    Place order as a seller (buying from another seller)
// @route   POST /api/seller/buy-products/order
// @access  Private (Seller only)
export const placeSellerOrder = async (req, res) => {
  try {
    const buyer = req.user;
    const { productId, quantity, shippingAddress, paymentMethod } = req.body;

    if (!productId || !quantity || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields: productId, quantity, shippingAddress, paymentMethod"
      });
    }

    // 1. Fetch and validate product
    const product = await Product.findById(productId).populate("sellerId", "firstName lastName businessName sellerType");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    if (!product.isActive || product.approvalStatus !== "approved") {
      return res.status(400).json({
        success: false,
        message: "This product is not active or approved for sale"
      });
    }

    const seller = product.sellerId;
    if (!seller) {
      return res.status(400).json({
        success: false,
        message: "Product owner not found"
      });
    }

    if (seller._id.toString() === buyer._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own product"
      });
    }

    // 2. Validate inventory
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} units available.`
      });
    }

    // 3. Enforce purchase rules
    const buyerType = buyer.sellerType || "free";
    const sellerType = seller.sellerType || "free";

    // Determine if it is a bulk purchase
    const minBulkQty = product.bulkPurchaseMinOrderQuantity || 10;
    const isBulk = quantity >= minBulkQty;

    // Rules:
    // - Free sellers can buy from premium sellers (bulk and single allowed)
    // - Premium sellers can buy from premium sellers (bulk and single allowed)
    // - Free sellers are not giving option for bulk selling (so no bulk purchases from free sellers, neither by free nor premium)
    // - Premium seller can't buy bulk products from free seller, he can buy only single product (quantity = 1)
    
    if (sellerType === "free") {
      if (buyerType === "premium") {
        if (quantity !== 1) {
          return res.status(400).json({
            success: false,
            message: "Premium sellers can only buy a single product (quantity = 1) from Free sellers."
          });
        }
      } else {
        // Buyer is free seller, owner is free seller
        if (isBulk) {
          return res.status(400).json({
            success: false,
            message: "Bulk selling is not allowed for Free sellers. You can buy individual products up to 5 units."
          });
        }
      }
    }

    // 4. Create the Order
    const subtotal = product.price * quantity;
    const shipping = subtotal > 999 ? 0 : 50; // simple shipping fee rule
    const totalAmount = subtotal + shipping;

    const order = new Order({
      user: buyer._id,
      items: [
        {
          product: product._id,
          seller: seller._id,
          title: product.title,
          price: product.price,
          quantity: quantity
        }
      ],
      shippingAddress,
      itemsPrice: subtotal,
      taxPrice: 0,
      shippingPrice: shipping,
      totalAmount: totalAmount,
      paymentInfo: {
        id: paymentMethod === "Direct" ? `direct_pay_${Date.now()}` : `cod_pay_${Date.now()}`,
        status: paymentMethod === "Direct" ? "success" : "pending",
        method: paymentMethod
      },
      paymentStatus: paymentMethod === "Direct" ? "completed" : "pending",
      isPaid: paymentMethod === "Direct",
      paidAt: paymentMethod === "Direct" ? Date.now() : null,
      orderStatus: "Processing"
    });

    const savedOrder = await order.save();

    // 5. Update Stock
    product.stock -= quantity;
    await product.save();

    // 6. Create Shipment
    const placedAt = savedOrder.createdAt || new Date();
    const displayOrderId = await generateDisplayOrderId(seller, placedAt);

    await Shipment.create({
      order: savedOrder._id,
      seller: seller._id,
      items: [
        {
          product: product._id,
          quantity: quantity
        }
      ],
      status: "Pending",
      displayOrderId,
      statusTimeline: { orderPlaced: placedAt }
    });

    // 7. Send Notifications
    try {
      // Notification for buyer
      const buyerNotification = await Notification.create({
        user: buyer._id,
        title: "Purchase Order Placed",
        message: `Order #${savedOrder._id.toString().slice(-8)} placed for ${quantity} x "${product.title}"`,
        type: "order",
        link: "/seller/dashboard"
      });
      sendNotificationToUser(buyer._id, buyerNotification);

      // Notification for seller
      const sellerNotification = await Notification.create({
        user: seller._id,
        title: "New Product Sale",
        message: `A seller purchased your product: "${product.title}" (Qty: ${quantity})`,
        type: "order",
        link: "/seller/orders-enquiries"
      });
      sendNotificationToUser(seller._id, sellerNotification);
    } catch (notifError) {
      console.error("Notification trigger failed:", notifError);
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: savedOrder
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to place purchase order: " + error.message
    });
  }
};
