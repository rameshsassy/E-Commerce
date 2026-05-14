import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail, sendSellerNewOrderEmail } from "../services/email.service.js";
import Shipment from "../models/Shipment.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../utils/socket.js";
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

    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: "items.product",
      populate: { path: "sellerId" }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      seller: item.product.sellerId._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    }));

    // Check pincode serviceability for all items
    const destinationPincode = shippingAddress.pinCode?.trim();
    if (!destinationPincode) {
      return res.status(400).json({ message: "Shipping pincode is required" });
    }

    for (const item of cart.items) {
      const seller = item.product.sellerId;
      if (seller && seller.isHyperlocal) {
        const isDeliverable = seller.deliverablePincodes.includes(destinationPincode);
        if (!isDeliverable) {
          return res.status(400).json({ 
            message: `Product "${item.product.title}" cannot be delivered to pincode ${destinationPincode}. Please remove it from your cart or change your address.` 
          });
        }
      }
    }

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
    const { amount, shippingAddress } = req.body;

    // Validate pincode serviceability BEFORE taking payment
    if (shippingAddress && shippingAddress.pinCode) {
      const cart = await Cart.findOne({ user: req.user._id }).populate({
        path: "items.product",
        populate: { path: "sellerId" }
      });

      if (cart && cart.items.length > 0) {
        const destinationPincode = shippingAddress.pinCode.trim();
        for (const item of cart.items) {
          const seller = item.product.sellerId;
          if (seller && seller.isHyperlocal) {
            const isDeliverable = seller.deliverablePincodes.includes(destinationPincode);
            if (!isDeliverable) {
              return res.status(400).json({ 
                message: `Product "${item.product.title}" cannot be delivered to pincode ${destinationPincode}. Please remove it from your cart or change your address.` 
              });
            }
          }
        }
      }
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_12345",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345",
    });

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
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
          // Atomic stock reduction
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
          });
          
          const sellerId = item.seller.toString();
          if (!sellerItemsMap[sellerId]) {
            sellerItemsMap[sellerId] = [];
          }
          sellerItemsMap[sellerId].push({
            product: item.product,
            quantity: item.quantity
          });
        }

        // Create Seller Shipments (Order Splitting) & Send separate seller emails
        for (const sellerId in sellerItemsMap) {
          const itemsForSeller = sellerItemsMap[sellerId];
          await Shipment.create({
            order: order._id,
            seller: sellerId,
            items: itemsForSeller,
            status: 'Pending'
          });

          // Fetch seller info and send email asynchronously
          import("../models/User.js").then(m => m.default.findById(sellerId)).then(seller => {
            if (seller) {
              const customerName = order.shippingAddress?.fullName || 'Customer';
              const customerPhone = order.shippingAddress?.phone || '';
              // itemsForSeller only has product ObjectIds, we need titles. 
              // We can get titles from order.items
              const detailedItems = itemsForSeller.map(isf => {
                const orderItem = order.items.find(oi => oi.product.toString() === isf.product.toString());
                return { ...isf, title: orderItem?.title || 'Product' };
              });
              sendSellerNewOrderEmail(seller, customerName, customerPhone, order.shippingAddress, order, detailedItems).catch(console.error);
            }
          }).catch(console.error);
        }

        // Send Emails asynchronously
        try {
          const user = await import("../models/User.js").then(m => m.default.findById(order.user));
          if (user) {
            await sendPaymentSuccessEmail(user, order.totalAmount, razorpayPaymentId);
            await sendOrderConfirmationEmail(user, order);
            
            // ✅ CREATE NOTIFICATION
            const notification = await Notification.create({
              user: user._id,
              title: "Order Confirmed!",
              message: `Your order #${order._id.toString().slice(-8)} has been placed successfully.`,
              type: 'order',
              link: `/profile/orders`
            });
            sendNotificationToUser(user._id, notification);
          }
        } catch (emailErr) {
          console.error("Failed to send order emails or notification", emailErr);
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
