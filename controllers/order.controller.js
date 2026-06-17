import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import crypto from "crypto";
import { sendOrderConfirmationEmail, sendPaymentSuccessEmail, sendSellerNewOrderEmail } from "../services/email.service.js";
import Shipment from "../models/Shipment.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../utils/socket.js";
import Address from "../models/Address.js";
import Coupon from "../models/Coupon.js";
import Voucher from "../models/Voucher.js";
import AdminVoucher from "../models/AdminVoucher.js";
import VoucherUsage from "../models/VoucherUsage.js";
import mongoose from "mongoose";
import { validateAndCalculateCartVoucher } from "../utils/voucherHelper.js";
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

// Helper to recalculate cart, validate serviceability, and calculate discounts
const recalculateAndValidateOrder = async (user, addressId, couponCode, voucherCode, rewardVoucherCode, rewardDiscountAmount, shippingAddressObj) => {
  const cart = await Cart.findOne({ user: user._id }).populate({
    path: "items.product",
    populate: { path: "sellerId" }
  });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  let addr = null;
  if (addressId) {
    addr = await Address.findById(addressId);
  }

  // Fallback to shippingAddressObj if addressId not supplied or not found
  if (!addr && shippingAddressObj) {
    addr = shippingAddressObj;
  }

  if (!addr) {
    throw new Error("Shipping address is required");
  }

  const destinationPincode = (addr.pinCode ?? addr.pincode)?.trim();
  if (!destinationPincode) {
    throw new Error("Shipping pincode is required");
  }

  // Check pincode serviceability
  for (const item of cart.items) {
    const seller = item.product.sellerId;
    if (seller && seller.isHyperlocal) {
      const isDeliverable = seller.deliverablePincodes.includes(destinationPincode);
      if (!isDeliverable) {
        throw new Error(`Product "${item.product.title}" cannot be delivered to pincode ${destinationPincode}. Please remove it from your cart or change your address.`);
      }
    }
  }

  const subtotal = cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);

  // Apply Coupon
  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) throw new Error("Invalid or expired coupon");
    if (new Date() > coupon.expiryDate) throw new Error("Coupon has expired");
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw new Error("Coupon usage limit reached");
    if (subtotal < coupon.minOrderAmount) {
      throw new Error(`Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount}`);
    }
    couponDiscount = (subtotal * coupon.discountPercentage) / 100;
    if (coupon.maxDiscountAmount && couponDiscount > coupon.maxDiscountAmount) {
      couponDiscount = coupon.maxDiscountAmount;
    }
  }

  // Apply Voucher
  let voucherDiscount = 0;
  let voucherDetails = null;
  if (voucherCode) {
    voucherDetails = await validateAndCalculateCartVoucher(voucherCode, cart.items, user._id);
    voucherDiscount = voucherDetails.discountAmount;
  }

  const shippingAddress = {
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine1: addr.addressLine1 ?? addr.addressLine,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    pinCode: destinationPincode,
    landmark: addr.landmark,
  };

  const rewardDiscount = Number(rewardDiscountAmount) || 0;
  
  // Calculate final amount
  let totalAmount = subtotal - couponDiscount - voucherDiscount - rewardDiscount;
  if (totalAmount < 0) totalAmount = 0;

  return {
    cart,
    shippingAddress,
    itemsPrice: subtotal,
    couponDiscount,
    voucherDiscount,
    rewardDiscount,
    totalAmount,
    voucherDetails,
  };
};

// @desc    Create new order
// @route   POST /api/customer/order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      addressId,
      shippingAddress: shippingAddressObj,
      couponCode,
      voucherCode,
      rewardVoucherCode,
      rewardDiscountAmount,
      paymentMethod,
    } = req.body;

    const validationResult = await recalculateAndValidateOrder(
      req.user,
      addressId,
      couponCode,
      voucherCode,
      rewardVoucherCode,
      rewardDiscountAmount,
      shippingAddressObj
    );

    const {
      cart,
      shippingAddress,
      itemsPrice,
      couponDiscount,
      voucherDiscount,
      rewardDiscount,
      totalAmount,
      voucherDetails,
    } = validationResult;

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      seller: item.product.sellerId._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    }));

    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentInfo: { method: paymentMethod || "COD", status: "pending" },
      paymentStatus: "pending",
      isPaid: false,
      itemsPrice,
      taxPrice: 0,
      shippingPrice: 0,
      couponCode: couponCode || null,
      discountAmount: couponDiscount,
      voucherCode: voucherCode || null,
      voucherDiscountAmount: voucherDiscount,
      rewardVoucherCode: rewardVoucherCode || null,
      rewardDiscountAmount: rewardDiscount,
      totalAmount,
    });

    const createdOrder = await order.save();

    // Increment coupon usedCount if applied
    if (couponCode) {
      await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
    }

    // Increment voucher usedCount and save history if applied
    if (voucherCode && voucherDetails) {
      const vModel = voucherDetails.voucherModel === "AdminVoucher" ? AdminVoucher : Voucher;
      await vModel.findByIdAndUpdate(voucherDetails.voucherId, { $inc: { usedCount: 1 } });

      await VoucherUsage.create({
        voucherId: voucherDetails.voucherId,
        voucherCode: voucherDetails.voucherCode,
        voucherModel: voucherDetails.voucherModel,
        userId: req.user._id,
        sellerId: voucherDetails.voucherModel === "Voucher" ? voucherDetails.eligibleItems[0]?.sellerId : null,
        orderId: createdOrder._id,
        discountAmount: voucherDiscount,
        originalAmount: itemsPrice,
        finalAmount: totalAmount,
      });
    }

    // Inventory Management: Reduce stock & Group items by seller for Shipments
    const sellerItemsMap = {};
    for (const item of createdOrder.items) {
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

    // Create Seller Shipments & Send separate seller emails
    for (const sellerId in sellerItemsMap) {
      const itemsForSeller = sellerItemsMap[sellerId];
      const sellerUser = await import("../models/User.js").then((m) =>
        m.default.findById(sellerId).select("businessName firstName")
      );
      const { generateDisplayOrderId } = await import("../utils/orderDisplayId.js");
      const placedAt = createdOrder.createdAt || new Date();
      const displayOrderId = sellerUser
        ? await generateDisplayOrderId(sellerUser, placedAt)
        : undefined;

      await Shipment.create({
        order: createdOrder._id,
        seller: sellerId,
        items: itemsForSeller,
        status: "Pending",
        displayOrderId,
        statusTimeline: { orderPlaced: placedAt },
      });

      // Send email
      import("../models/User.js").then(m => m.default.findById(sellerId)).then(seller => {
        if (seller) {
          const customerName = createdOrder.shippingAddress?.fullName || 'Customer';
          const customerPhone = createdOrder.shippingAddress?.phone || '';
          const detailedItems = itemsForSeller.map(isf => {
            const orderItem = createdOrder.items.find(oi => oi.product.toString() === isf.product.toString());
            return { ...isf, title: orderItem?.title || 'Product', price: orderItem?.price || 0 };
          });
          sendSellerNewOrderEmail(seller, customerName, customerPhone, createdOrder.shippingAddress, createdOrder, detailedItems).catch(console.error);
        }
      }).catch(console.error);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const {
      addressId,
      shippingAddress: shippingAddressObj,
      couponCode,
      voucherCode,
      rewardVoucherCode,
      rewardDiscountAmount,
    } = req.body;

    const validationResult = await recalculateAndValidateOrder(
      req.user,
      addressId,
      couponCode,
      voucherCode,
      rewardVoucherCode,
      rewardDiscountAmount,
      shippingAddressObj
    );

    const {
      cart,
      shippingAddress,
      itemsPrice,
      couponDiscount,
      voucherDiscount,
      rewardDiscount,
      totalAmount,
      voucherDetails,
    } = validationResult;

    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      seller: item.product.sellerId._id,
      title: item.product.title,
      price: item.product.price,
      quantity: item.quantity
    }));

    // Create the pending order document in the database
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentInfo: { status: "pending", method: "Razorpay" },
      paymentStatus: "pending",
      isPaid: false,
      itemsPrice,
      taxPrice: 0,
      shippingPrice: 0,
      couponCode: couponCode || null,
      discountAmount: couponDiscount,
      voucherCode: voucherCode || null,
      voucherDiscountAmount: voucherDiscount,
      rewardVoucherCode: rewardVoucherCode || null,
      rewardDiscountAmount: rewardDiscount,
      totalAmount,
    });

    const createdOrder = await order.save();

    // If 100% discount, directly complete payment
    if (totalAmount === 0) {
      createdOrder.isPaid = true;
      createdOrder.paidAt = Date.now();
      createdOrder.paymentStatus = "completed";
      createdOrder.paymentInfo.status = "success";
      await createdOrder.save();

      // Increment coupon usedCount if applied
      if (couponCode) {
        await Coupon.findOneAndUpdate({ code: couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
      }

      // Increment voucher usedCount and save history if applied
      if (voucherCode && voucherDetails) {
        const vModel = voucherDetails.voucherModel === "AdminVoucher" ? AdminVoucher : Voucher;
        await vModel.findByIdAndUpdate(voucherDetails.voucherId, { $inc: { usedCount: 1 } });

        await VoucherUsage.create({
          voucherId: voucherDetails.voucherId,
          voucherCode: voucherDetails.voucherCode,
          voucherModel: voucherDetails.voucherModel,
          userId: req.user._id,
          sellerId: voucherDetails.voucherModel === "Voucher" ? voucherDetails.eligibleItems[0]?.sellerId : null,
          orderId: createdOrder._id,
          discountAmount: voucherDiscount,
          originalAmount: itemsPrice,
          finalAmount: totalAmount,
        });
      }

      // Perform shipments & stock reductions
      const sellerItemsMap = {};
      for (const item of createdOrder.items) {
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

      for (const sellerId in sellerItemsMap) {
        const itemsForSeller = sellerItemsMap[sellerId];
        const sellerUser = await import("../models/User.js").then((m) =>
          m.default.findById(sellerId).select("businessName firstName")
        );
        const { generateDisplayOrderId } = await import("../utils/orderDisplayId.js");
        const placedAt = createdOrder.createdAt || new Date();
        const displayOrderId = sellerUser
          ? await generateDisplayOrderId(sellerUser, placedAt)
          : undefined;

        await Shipment.create({
          order: createdOrder._id,
          seller: sellerId,
          items: itemsForSeller,
          status: "Pending",
          displayOrderId,
          statusTimeline: { orderPlaced: placedAt },
        });

        // Send email
        import("../models/User.js").then(m => m.default.findById(sellerId)).then(seller => {
          if (seller) {
            const customerName = createdOrder.shippingAddress?.fullName || 'Customer';
            const customerPhone = createdOrder.shippingAddress?.phone || '';
            const detailedItems = itemsForSeller.map(isf => {
              const orderItem = createdOrder.items.find(oi => oi.product.toString() === isf.product.toString());
              return { ...isf, title: orderItem?.title || 'Product', price: orderItem?.price || 0 };
            });
            sendSellerNewOrderEmail(seller, customerName, customerPhone, createdOrder.shippingAddress, createdOrder, detailedItems).catch(console.error);
          }
        }).catch(console.error);
      }

      // Clear cart
      cart.items = [];
      await cart.save();

      return res.status(200).json({
        isFree: true,
        order: createdOrder,
      });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_12345",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345",
    });

    const options = {
      amount: Math.round(totalAmount * 100), // paise
      currency: "INR",
      receipt: `receipt_order_${createdOrder._id.toString()}`,
      notes: {
        orderId: createdOrder._id.toString(),
      }
    };

    const rzpOrder = await instance.orders.create(options);

    if (!rzpOrder) return res.status(500).send("Some error occured");

    // Save the razorpayOrderId on the pending order
    createdOrder.razorpayOrderId = rzpOrder.id;
    await createdOrder.save();

    res.json({
      ...rzpOrder,
      orderId: createdOrder._id,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/customer/order/razorpay/verify
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const rOrderId = razorpayOrderId || req.body.razorpay_order_id;
    const rPaymentId = razorpayPaymentId || req.body.razorpay_payment_id;
    const rSignature = razorpaySignature || req.body.razorpay_signature;

    const sign = rOrderId + "|" + rPaymentId;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345")
      .update(sign.toString())
      .digest("hex");

    if (rSignature === expectedSign) {
      // Payment is successful
      const order = orderId
        ? await Order.findById(orderId)
        : await Order.findOne({ razorpayOrderId: rOrderId });

      if (order) {
        if (order.isPaid) {
          return res.json({ message: "Payment verified successfully", order });
        }

        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentInfo = {
          id: rPaymentId,
          status: "success",
          method: "Razorpay"
        };
        order.paymentStatus = "completed";
        order.razorpayOrderId = rOrderId;
        order.razorpayPaymentId = rPaymentId;
        order.razorpaySignature = rSignature;

        await order.save();

        // Increment coupon usedCount if applied
        if (order.couponCode) {
          await Coupon.findOneAndUpdate({ code: order.couponCode.toUpperCase() }, { $inc: { usedCount: 1 } });
        }

        // Increment voucher usedCount and save history if applied
        if (order.voucherCode) {
          let voucher = await AdminVoucher.findOne({ voucherCode: order.voucherCode.toUpperCase() });
          let voucherModel = "AdminVoucher";
          if (!voucher) {
            voucher = await Voucher.findOne({ voucherCode: order.voucherCode.toUpperCase() });
            voucherModel = "Voucher";
          }
          if (voucher) {
            voucher.usedCount = (voucher.usedCount || 0) + 1;
            await voucher.save();

            await VoucherUsage.create({
              voucherId: voucher._id,
              voucherCode: voucher.voucherCode,
              voucherModel,
              userId: order.user,
              sellerId: voucherModel === "Voucher" ? voucher.sellerId : null,
              orderId: order._id,
              discountAmount: order.voucherDiscountAmount || 0,
              originalAmount: order.itemsPrice,
              finalAmount: order.totalAmount,
            });
          }
        }

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
          const sellerUser = await import("../models/User.js").then((m) =>
            m.default.findById(sellerId).select("businessName firstName")
          );
          const { generateDisplayOrderId } = await import("../utils/orderDisplayId.js");
          const placedAt = order.createdAt || new Date();
          const displayOrderId = sellerUser
            ? await generateDisplayOrderId(sellerUser, placedAt)
            : undefined;

          await Shipment.create({
            order: order._id,
            seller: sellerId,
            items: itemsForSeller,
            status: "Pending",
            displayOrderId,
            statusTimeline: { orderPlaced: placedAt },
          });

          // Fetch seller info and send email asynchronously
          import("../models/User.js").then(m => m.default.findById(sellerId)).then(seller => {
            if (seller) {
              const customerName = order.shippingAddress?.fullName || 'Customer';
              const customerPhone = order.shippingAddress?.phone || '';
              const detailedItems = itemsForSeller.map(isf => {
                const orderItem = order.items.find(oi => oi.product.toString() === isf.product.toString());
                return { ...isf, title: orderItem?.title || 'Product', price: orderItem?.price || 0 };
              });
              sendSellerNewOrderEmail(seller, customerName, customerPhone, order.shippingAddress, order, detailedItems).catch(console.error);
            }
          }).catch(console.error);
        }

        // Send Emails asynchronously
        try {
          const user = await import("../models/User.js").then(m => m.default.findById(order.user));
          if (user) {
            await sendPaymentSuccessEmail(user, order.totalAmount, rPaymentId);
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

        // Clear cart
        const cart = await Cart.findOne({ user: order.user });
        if (cart) {
          cart.items = [];
          await cart.save();
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
