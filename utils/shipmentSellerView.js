import Shipment from "../models/Shipment.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { generateDisplayOrderId } from "./orderDisplayId.js";
import {
  inferSellerOrderStatus,
  buildTimelineForResponse,
  activeTimelineIndex,
  SELLER_ORDER_STATUS_OPTIONS,
  TIMELINE_STEPS,
} from "./sellerOrderStatus.js";

function refId(value) {
  if (value == null) return "";
  if (typeof value === "object" && value._id != null) return String(value._id);
  return String(value);
}

function getPlatformFeePercent() {
  const raw = process.env.SELLER_PLATFORM_FEE_PERCENT;
  const n = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  return 12.39;
}

function paymentLabel(order) {
  const method = order?.paymentInfo?.method || "";
  const status = order?.paymentStatus || "";
  if (status === "completed" || method) return "Pre-paid order";
  return "Payment pending";
}

function formatAddress(addr) {
  if (!addr) return "";
  return [
    addr.address,
    addr.addressLine1,
    addr.addressLine2,
    addr.city,
    addr.state,
    addr.country,
    addr.pinCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export async function ensureDisplayOrderId(shipment, seller) {
  if (shipment.displayOrderId) return shipment.displayOrderId;
  const orderDate = shipment.order?.createdAt || shipment.createdAt;
  const displayOrderId = await generateDisplayOrderId(seller, orderDate);
  await Shipment.updateOne({ _id: shipment._id }, { $set: { displayOrderId } });
  shipment.displayOrderId = displayOrderId;
  return displayOrderId;
}

export async function mapShipmentForSeller(s, sellerIdStr, sellerDoc, { persistMissingId = true } = {}) {
  const order = s.order || {};
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const platformFeePercent = getPlatformFeePercent();
  const platformFeeRate = platformFeePercent / 100;

  let shipmentDoc = s;
  if (persistMissingId && !s.displayOrderId && sellerDoc) {
    const id = await ensureDisplayOrderId(s, sellerDoc);
    shipmentDoc = { ...s, displayOrderId: id };
  }

  const itemDetails = (shipmentDoc.items || []).map((it, index) => {
    const productId = it?.product?._id ? String(it.product._id) : String(it.product);
    const matchingOrderItem = orderItems.find(
      (oi) => refId(oi.product) === productId && refId(oi.seller) === sellerIdStr
    );
    const unitPrice = Number(matchingOrderItem?.price ?? it?.product?.price ?? 0);
    const quantity = Number(it?.quantity ?? 0);
    const lineTotal = unitPrice * quantity;
    const variantLabel =
      it?.variantLabel ||
      matchingOrderItem?.variantLabel ||
      `Variant ${index + 1}`;

    return {
      productId,
      title: it?.product?.title || matchingOrderItem?.title || "—",
      images: it?.product?.images || [],
      quantity,
      unitPrice,
      lineTotal,
      variantLabel,
    };
  });

  const sellerGross = itemDetails.reduce((sum, r) => sum + Number(r.lineTotal || 0), 0);
  const sellerPayout = Math.max(0, sellerGross * (1 - platformFeeRate));

  const addr = order.shippingAddress || {};
  const customerName = addr.fullName || addr.name || "—";
  const customerCity = addr.city || "—";
  const customerEmail = order.user?.email || order.customerEmail || "—";
  const customerPhone = addr.phone || "—";

  let priorOrders = 0;
  if (order.user?._id && order._id) {
    const otherOrderIds = await Order.find({
      user: order.user._id,
      _id: { $ne: order._id },
    }).distinct("_id");
    if (otherOrderIds.length) {
      priorOrders = await Shipment.countDocuments({
        seller: shipmentDoc.seller,
        order: { $in: otherOrderIds },
      });
    }
  }
  const customerTag = priorOrders > 0 ? "Returning Customer" : "New Customer";

  const sellerOrderStatus = inferSellerOrderStatus(
    shipmentDoc.status,
    shipmentDoc.sellerOrderStatus
  );
  const statusDisplay = sellerOrderStatus || "Order Placed";
  const timelineKeyForUpdated =
    sellerOrderStatus === "Order Dispatched"
      ? "orderDispatched"
      : sellerOrderStatus === "Order Shipped"
        ? "orderShipped"
        : sellerOrderStatus === "Order in Transit"
          ? "orderInTransit"
          : sellerOrderStatus === "Product Delivered"
            ? "orderDelivered"
            : sellerOrderStatus === "Accept Order"
              ? "orderAccepted"
              : "orderPlaced";
  const statusUpdatedAt =
    shipmentDoc.statusTimeline?.[timelineKeyForUpdated] ||
    shipmentDoc.updatedAt;

  const timeline = buildTimelineForResponse(
    shipmentDoc.statusTimeline,
    order.createdAt || shipmentDoc.createdAt,
    shipmentDoc.estimatedDeliveryDate
  );

  return {
    _id: shipmentDoc._id,
    displayOrderId: shipmentDoc.displayOrderId || null,
    status: shipmentDoc.status,
    sellerOrderStatus,
    statusDisplay,
    statusOptions: SELLER_ORDER_STATUS_OPTIONS,
    statusUpdatedAt,
    trackingId: shipmentDoc.trackingId || "",
    courierName: shipmentDoc.courierName || "",
    estimatedDeliveryDate: shipmentDoc.estimatedDeliveryDate || null,
    actualDeliveryDate: shipmentDoc.actualDeliveryDate || null,
    createdAt: shipmentDoc.createdAt,
    updatedAt: shipmentDoc.updatedAt,
    customer: {
      _id: order.user?._id || order.user || "",
      name: customerName,
      city: customerCity,
      tag: `${customerCity} | ${customerTag}`,
      email: customerEmail,
      phone: customerPhone,
      shippingAddress: formatAddress(addr),
    },
    order: {
      _id: order?._id,
      createdAt: order?.createdAt,
      paymentLabel: paymentLabel(order),
      shippingAddress: addr,
    },
    items: itemDetails,
    sellerGross,
    platformFeePercent,
    sellerPayout,
    timeline,
    timelineSteps: TIMELINE_STEPS,
    activeTimelineIndex: activeTimelineIndex(shipmentDoc.statusTimeline, sellerOrderStatus),
  };
}

export async function enrichShipmentsList(shipments, sellerId) {
  const seller = await User.findById(sellerId).select("businessName firstName");
  const sellerIdStr = String(sellerId);
  const out = [];
  for (const s of shipments) {
    out.push(await mapShipmentForSeller(s, sellerIdStr, seller, { persistMissingId: true }));
  }
  return out;
}
