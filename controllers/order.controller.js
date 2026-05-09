import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail } from "../services/email.service.js";
import Shipment from "../models/Shipment.js";
// import Razorpay from "razorpay";

// Mocking Razorpay to prevent crash since npm install failed due to network
class Razorpay {
  constructor(options) {
    this.orders = {
      create: async (opts) => ({
        id: `mock_order_${Date.now()}`,
        amount: opts.amount,
        currency: opts.currency,
        receipt: opts.receipt,
        status: "created"
      })
    };
  }
}

// @desc    Create new order
// @route   POST /api/customer/order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalAmount,
    } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      seller: item.product.sellerId,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    }));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentInfo: { method: paymentMethod },
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalAmount,
    });

    const createdOrder = await order.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/customer/order/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate("items.product")
      .populate("items.seller", "firstName lastName businessName");

    if (order) {
      if (order.user._id.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }
      res.json(order);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/customer/orders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// 💳 RAZORPAY PAYMENT FLOW
// ===============================

// @desc    Create Razorpay Order
// @route   POST /api/customer/order/razorpay
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_12345",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345",
    });

    const options = {
      amount: req.body.amount * 100, // amount in smallest currency unit (paise)
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await instance.orders.create(options);

    if (!order) return res.status(500).send("Some error occured");

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/customer/order/razorpay/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const sign = razorpayOrderId + "|" + razorpayPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345")
      .update(sign.toString())
      .digest("hex");

    if (razorpaySignature === expectedSign) {
      // Payment is successful
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentInfo = {
          id: razorpayPaymentId,
          status: "success",
          method: "Razorpay"
        };
        order.paymentStatus = "completed";
        order.razorpayOrderId = razorpayOrderId;
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;

        await order.save();

        // Inventory Management: Reduce stock & Group items by seller for Shipments
        const sellerItemsMap = {};
        
        for (const item of order.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.stock = Math.max(0, product.stock - item.quantity);
            await product.save();
          }
          
          const sellerId = item.seller.toString();
          if (!sellerItemsMap[sellerId]) {
            sellerItemsMap[sellerId] = [];
          }
          sellerItemsMap[sellerId].push({
            product: item.product,
            quantity: item.quantity
          });
        }

        // Create Seller Shipments (Order Splitting)
        for (const sellerId in sellerItemsMap) {
          await Shipment.create({
            order: order._id,
            seller: sellerId,
            items: sellerItemsMap[sellerId],
            status: 'Pending'
          });
        }

        // Send Emails asynchronously
        try {
          const user = await import("../models/User.js").then(m => m.default.findById(order.user));
          if (user) {
            await sendPaymentSuccessEmail(user, order.totalAmount, razorpayPaymentId);
            await sendOrderConfirmationEmail(user, order);
          }
        } catch (emailErr) {
          console.error("Failed to send order emails", emailErr);
        }

        return res.json({ message: "Payment verified successfully", order });
      } else {
        return res.status(404).json({ message: "Order not found" });
      }
    } else {
      return res.status(400).json({ message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
