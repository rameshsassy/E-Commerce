import ReturnRequest from "../models/ReturnRequest.js";
import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js";
import { sendRefundUpdateEmail } from "../services/email.service.js";

// @desc    Create Return Request
// @route   POST /api/customer/returns
// @access  Private
export const createReturnRequest = async (req, res) => {
  try {
    const { orderId, productId, sellerId, reason, description, images, type } = req.body;

    // Check if shipment is actually delivered
    const shipment = await Shipment.findOne({ order: orderId, seller: sellerId, 'items.product': productId });
    
    if (!shipment || shipment.status !== 'Delivered') {
      return res.status(400).json({ message: "Can only return delivered items." });
    }

    const returnRequest = new ReturnRequest({
      order: orderId,
      user: req.user._id,
      product: productId,
      seller: sellerId,
      reason,
      description,
      images,
      type
    });

    await returnRequest.save();
    res.status(201).json(returnRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Customer Returns
// @route   GET /api/customer/returns
// @access  Private
export const getMyReturns = async (req, res) => {
  try {
    const returns = await ReturnRequest.find({ user: req.user._id })
      .populate('product', 'title images')
      .populate('seller', 'businessName')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Return Status (Seller/Admin Action)
// @route   PUT /api/seller/returns/:returnId/status
// @access  Private
export const updateReturnStatus = async (req, res) => {
  try {
    const { status, refundAmount } = req.body;
    const returnReq = await ReturnRequest.findById(req.params.returnId).populate('order');
    
    if (!returnReq) return res.status(404).json({ message: "Return request not found" });

    if (req.user.role === 'seller' && returnReq.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    returnReq.status = status;

    // If approved for refund, initiate Razorpay Refund logic
    if (status === 'Completed' && returnReq.type === 'Refund') {
      returnReq.refundStatus = 'Processed';
      if (refundAmount) returnReq.refundAmount = refundAmount;
      
      // MOCK Razorpay Refund API call
      // const instance = new Razorpay(...);
      // await instance.payments.refund(returnReq.order.razorpayPaymentId, { amount: refundAmount * 100 });
      
      // Notify customer
      try {
        const user = await import("../models/User.js").then(m => m.default.findById(returnReq.user));
        await sendRefundUpdateEmail(user, returnReq.order._id, refundAmount || 0, 'Processed');
      } catch(err) {}
    }

    await returnReq.save();
    res.json(returnReq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
