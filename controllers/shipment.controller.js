import Shipment from "../models/Shipment.js";
import { trackShipmentAPI, createShippingLabel } from "../services/shipping.service.js";
import { sendShipmentUpdateEmail } from "../services/email.service.js";

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

// @desc    Update Shipment Status (Seller/Admin Action)
// @route   PUT /api/seller/shipments/:shipmentId/status
// @access  Private (Seller/Admin)
export const updateShipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const shipment = await Shipment.findById(req.params.shipmentId).populate('order');
    
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });

    // Ensure seller owns this shipment
    if (req.user.role === 'seller' && shipment.seller.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    // Logic: If status changes to 'Packed', automatically generate label and tracking via Shiprocket
    if (status === 'Packed' && shipment.status === 'Pending') {
      const labelDetails = await createShippingLabel({
        // details mapped from shipment
        shipment_id: shipment._id
      });
      
      shipment.trackingId = labelDetails.awb_code;
      shipment.courierName = labelDetails.courier_name;
      shipment.estimatedDeliveryDate = labelDetails.estimated_delivery;
    }

    shipment.status = status;
    if (status === 'Delivered') shipment.actualDeliveryDate = Date.now();
    
    await shipment.save();

    // Send email notification asynchronously
    try {
      const user = await import("../models/User.js").then(m => m.default.findById(shipment.order.user));
      await sendShipmentUpdateEmail(user, shipment.order, shipment.trackingId, shipment.courierName, status);
    } catch(err) {
      console.error("Failed to send shipment update email");
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
