export const SELLER_ORDER_STATUS_OPTIONS = [
  "Accept Order",
  "Reject Order",
  "Order Dispatched",
  "Order Shipped",
  "Order in Transit",
  "Product Delivered",
];

export const TIMELINE_STEPS = [
  { key: "orderPlaced", label: "Order Placed" },
  { key: "orderAccepted", label: "Order Accepted" },
  { key: "orderDispatched", label: "Order Dispatched" },
  { key: "orderShipped", label: "Order Shipped" },
  { key: "orderInTransit", label: "Order in transit" },
  { key: "orderDelivered", label: "Order Successfully Delivered" },
  { key: "estimatedDelivery", label: "Estimated Delivery" },
];

const STATUS_TO_TIMELINE_KEY = {
  "Accept Order": "orderAccepted",
  "Reject Order": null,
  "Order Dispatched": "orderDispatched",
  "Order Shipped": "orderShipped",
  "Order in Transit": "orderInTransit",
  "Product Delivered": "orderDelivered",
};

const STATUS_TO_LEGACY = {
  "Accept Order": "Accepted",
  "Reject Order": "Cancelled",
  "Order Dispatched": "Packed",
  "Order Shipped": "Shipped",
  "Order in Transit": "Out For Delivery",
  "Product Delivered": "Delivered",
};

const LEGACY_TO_SELLER_STATUS = {
  Pending: null,
  Accepted: "Accept Order",
  Packed: "Order Dispatched",
  Shipped: "Order Shipped",
  "Out For Delivery": "Order in Transit",
  Delivered: "Product Delivered",
  Cancelled: "Reject Order",
};

export function legacyStatusForSellerStatus(sellerOrderStatus) {
  return STATUS_TO_LEGACY[sellerOrderStatus] || "Pending";
}

export function inferSellerOrderStatus(legacyStatus, sellerOrderStatus) {
  if (sellerOrderStatus && SELLER_ORDER_STATUS_OPTIONS.includes(sellerOrderStatus)) {
    return sellerOrderStatus;
  }
  return LEGACY_TO_SELLER_STATUS[legacyStatus] ?? null;
}

export function timelineKeyForStatus(sellerOrderStatus) {
  return STATUS_TO_TIMELINE_KEY[sellerOrderStatus] ?? null;
}

export function activeTimelineIndex(timeline, sellerOrderStatus) {
  const keys = TIMELINE_STEPS.map((s) => s.key);
  let maxIdx = 0;
  for (let i = 0; i < keys.length; i++) {
    if (timeline?.[keys[i]]) maxIdx = i;
  }
  const statusKey = timelineKeyForStatus(sellerOrderStatus);
  if (statusKey) {
    const idx = keys.indexOf(statusKey);
    if (idx >= 0) maxIdx = Math.max(maxIdx, idx);
  }
  return maxIdx;
}

export function formatTimelineTimestamp(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} : ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function applyStatusToTimeline(timeline, sellerOrderStatus, at = new Date()) {
  const next = { ...(timeline || {}) };
  const key = timelineKeyForStatus(sellerOrderStatus);
  if (key) next[key] = at;
  if (sellerOrderStatus === "Order Dispatched" && !next.estimatedDelivery) {
    const est = new Date(at);
    est.setDate(est.getDate() + 3);
    next.estimatedDelivery = est;
  }
  if (sellerOrderStatus === "Product Delivered") {
    next.orderDelivered = at;
  }
  return next;
}

export function buildTimelineForResponse(timeline, orderCreatedAt, estimatedDeliveryDate) {
  const base = timeline || {};
  const out = {};
  for (const step of TIMELINE_STEPS) {
    let at = base[step.key];
    if (step.key === "orderPlaced" && !at && orderCreatedAt) at = orderCreatedAt;
    if (step.key === "estimatedDelivery" && !at && estimatedDeliveryDate) {
      at = estimatedDeliveryDate;
    }
    out[step.key] = {
      label: step.label,
      at: at || null,
      formatted: formatTimelineTimestamp(at),
    };
  }
  return out;
}
