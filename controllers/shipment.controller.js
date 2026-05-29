import Shipment from "../models/Shipment.js";
import User from "../models/User.js";
import { trackShipmentAPI, createShippingLabel } from "../services/shipping.service.js";
import { sendShipmentUpdateEmail } from "../services/email.service.js";
import Notification from "../models/Notification.js";
import { sendNotificationToUser } from "../utils/socket.js";
import {
  SELLER_ORDER_STATUS_OPTIONS,
  legacyStatusForSellerStatus,
  applyStatusToTimeline,
} from "../utils/sellerOrderStatus.js";
import { enrichShipmentsList, mapShipmentForSeller } from "../utils/shipmentSellerView.js";
import { logOrderStatusActivity } from "../services/sellerActivity.service.js";

// @desc    List shipments for logged in seller (or admin filter)
// @route   GET /api/shipments/seller
// @access  Private (Seller/Admin)
export const listSellerShipments = async (req, res) => {
  try {
    const u = req.user;
    const isSeller = u?.role === "seller";

    const sellerId = isSeller ? u._id : (req.query?.sellerId || u?._id);
    if (!sellerId) return res.status(400).json({ message: "sellerId is required" });

    const shipments = await Shipment.find({ seller: sellerId })
      .populate({
        path: "order",
        select:
          "createdAt shippingAddress items totalAmount paymentStatus paymentInfo orderStatus user",
        populate: { path: "user", select: "email firstName" },
      })
      .populate({
        path: "items.product",
        select: "title images price",
      })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = await enrichShipmentsList(shipments, sellerId);

    res.json({ count: mapped.length, shipments: mapped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all shipments for an order
// @route   GET /api/customer/shipments/order/:orderId
// @access  Private
export const getShipmentsByOrder = async (req, res) => {
  try {
    const shipments = await Shipment.find({ order: req.params.orderId })
      .populate("seller", "businessName firstName")
      .populate("items.product", "title images");
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get shipment tracking timeline
// @route   GET /api/customer/shipments/track/:shipmentId
// @access  Private
export const trackShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.shipmentId);
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    if (shipment.trackingId) {
      // Call external logistics provider tracking API
      const trackingDetails = await trackShipmentAPI(shipment.trackingId);
      return res.json({ shipment, trackingDetails });
    }

    res.json({ shipment, trackingDetails: { current_status: shipment.status, tracking_data: [] } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single shipment detail for seller individual order view
// @route   GET /api/shipments/seller/:shipmentId
// @access  Private (Seller/Admin)
export const getSellerShipmentDetail = async (req, res) => {
  try {
    const u = req.user;
    const isSeller = u?.role === "seller";
    const sellerId = isSeller ? u._id : req.query?.sellerId;

    const shipment = await Shipment.findById(req.params.shipmentId)
      .populate({
        path: "order",
        select:
          "createdAt shippingAddress items totalAmount paymentStatus paymentInfo orderStatus user",
        populate: { path: "user", select: "email firstName" },
      })
      .populate({ path: "items.product", select: "title images price" })
      .lean();

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    if (isSeller && String(shipment.seller) !== String(u._id)) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const seller = await User.findById(shipment.seller).select("businessName firstName");
    const data = await mapShipmentForSeller(
      shipment,
      String(shipment.seller),
      seller,
      { persistMissingId: true }
    );

    res.json({ message: "Shipment fetched", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Shipment Status (Seller/Admin Action)
// @route   PUT /api/shipments/seller/:shipmentId/status
// @access  Private (Seller/Admin)
export const updateShipmentStatus = async (req, res) => {
  try {
    const { status, sellerOrderStatus } = req.body;
    const shipment = await Shipment.findById(req.params.shipmentId).populate("order");

    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    if (req.user.role === "seller" && shipment.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let nextLegacy = status;
    let nextSellerStatus = sellerOrderStatus;

    if (sellerOrderStatus) {
      if (!SELLER_ORDER_STATUS_OPTIONS.includes(sellerOrderStatus)) {
        return res.status(400).json({ message: "Invalid seller order status" });
      }
      nextLegacy = legacyStatusForSellerStatus(sellerOrderStatus);
      nextSellerStatus = sellerOrderStatus;
      shipment.sellerOrderStatus = sellerOrderStatus;
      shipment.statusTimeline = applyStatusToTimeline(
        shipment.statusTimeline?.toObject?.() ?? shipment.statusTimeline,
        sellerOrderStatus
      );
      shipment.markModified("statusTimeline");
      if (sellerOrderStatus === "Order Dispatched") {
        shipment.estimatedDeliveryDate =
          shipment.statusTimeline?.estimatedDelivery ||
          shipment.estimatedDeliveryDate;
      }
    }

    if (!nextLegacy) {
      return res.status(400).json({ message: "status or sellerOrderStatus is required" });
    }

    if (nextLegacy === "Packed" && !shipment.trackingId) {
      try {
        const labelDetails = await createShippingLabel({
          shipment_id: shipment._id,
        });
        shipment.trackingId = labelDetails.awb_code;
        shipment.courierName = labelDetails.courier_name;
        shipment.estimatedDeliveryDate = labelDetails.estimated_delivery;
      } catch (labelErr) {
        console.error("Shipping label creation failed:", labelErr?.message || labelErr);
      }
    }

    shipment.status = nextLegacy;
    if (nextLegacy === "Delivered") shipment.actualDeliveryDate = Date.now();

    await shipment.save();

    if (req.user.role === "seller" && (nextSellerStatus || nextLegacy)) {
      logOrderStatusActivity(
        req.user._id,
        shipment.displayOrderId,
        nextSellerStatus || nextLegacy
      );
    }

    // Send email notification asynchronously
    try {
      const user = await import("../models/User.js").then(m => m.default.findById(shipment.order.user));
      await sendShipmentUpdateEmail(
        user,
        shipment.order,
        shipment.trackingId,
        shipment.courierName,
        nextLegacy
      );
      
      // ✅ CREATE NOTIFICATION
      const notification = await Notification.create({
        user: user._id,
        title: `Shipment Updated: ${nextSellerStatus || nextLegacy}`,
        message: `Your package (ID: #${shipment._id.toString().slice(-8)}) is now ${nextSellerStatus || nextLegacy}.`,
        type: 'shipment',
        link: `/track/${shipment._id}`
      });
      sendNotificationToUser(user._id, notification);

    } catch(err) {
      console.error("Failed to send shipment notification", err);
    }

    const seller = await User.findById(shipment.seller).select("businessName firstName");
    const populated = await Shipment.findById(shipment._id)
      .populate({
        path: "order",
        select:
          "createdAt shippingAddress items totalAmount paymentStatus paymentInfo orderStatus user",
        populate: { path: "user", select: "email firstName" },
      })
      .populate({ path: "items.product", select: "title images price" })
      .lean();

    const data = await mapShipmentForSeller(
      populated,
      String(shipment.seller),
      seller,
      { persistMissingId: false }
    );

    res.json({ message: "Shipment updated", data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
