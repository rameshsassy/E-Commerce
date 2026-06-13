import BulkInquiry from "../models/BulkInquiry.js";
import { generateBulkRequestId } from "./bulkRequestId.js";
import { BUYER_TYPE_OPTIONS } from "./bulkInquiryConstants.js";
import {
  buildTimelineForResponse,
  activeTimelineIndex,
  inferSellerOrderStatus,
} from "./sellerOrderStatus.js";

export function parseQuantityVariants(quantityRequired) {
  const raw = String(quantityRequired || "").trim();
  if (!raw) return [{ label: "Variant 1", quantity: "—" }];

  const parts = raw
    .split(/[\n,;|]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    const num = raw.match(/(\d+)/);
    return [{ label: "Variant 1", quantity: num ? num[1] : raw }];
  }

  return parts.map((part, i) => {
    const labeled = part.match(/^(.+?)[:\s-]+(\d+)\s*$/i);
    if (labeled) {
      return { label: labeled[1].trim(), quantity: labeled[2] };
    }
    const num = part.match(/(\d+)/);
    return {
      label: `Variant ${i + 1}`,
      quantity: num ? num[1] : part,
    };
  });
}

function formatDateOnly(date) {
  if (!date) return "—";
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function daysBetween(from, to) {
  if (!from || !to) return null;
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export function estimateCostFromProduct(product, variantLines, row = {}) {
  let unitPrice = Number(product?.price ?? product?.bulkPrice ?? 0);
  if (!unitPrice && row.productPrice) {
    const priceStr = String(row.productPrice).replace(/[^\d]/g, "");
    unitPrice = Number(priceStr) || 0;
  }
  if (!unitPrice) return null;
  const totalUnits = variantLines.reduce((sum, v) => {
    const n = parseInt(String(v.quantity).replace(/\D/g, ""), 10);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);
  if (!totalUnits) return null;
  return unitPrice * totalUnits;
}

export async function ensureBulkRequestId(inquiry) {
  if (inquiry.displayBulkRequestId) return inquiry.displayBulkRequestId;
  const id = await generateBulkRequestId(inquiry.sellerId, inquiry.createdAt);
  await BulkInquiry.updateOne({ _id: inquiry._id }, { $set: { displayBulkRequestId: id } });
  return id;
}

export async function mapBulkInquiryForSeller(row, { persistId = true } = {}) {
  const product = row.productId && typeof row.productId === "object" ? row.productId : null;
  const productId = product?._id || row.productId;

  let displayBulkRequestId = row.displayBulkRequestId;
  if (!displayBulkRequestId && persistId) {
    displayBulkRequestId = await ensureBulkRequestId(row);
  }

  const variantLines =
    Array.isArray(row.variantLines) && row.variantLines.length
      ? row.variantLines
      : parseQuantityVariants(row.quantityRequired);

  const estimatedCost =
    row.estimatedCost != null
      ? Number(row.estimatedCost)
      : estimateCostFromProduct(product, variantLines, row);

  const placedAt = row.createdAt;
  const requestedDeliveryDate =
    row.requestedDeliveryDate ||
    (() => {
      const d = new Date(placedAt || Date.now());
      d.setDate(d.getDate() + (row.deliveryLeadDays || 30));
      return d;
    })();

  const leadDays =
    row.deliveryLeadDays ??
    daysBetween(placedAt, requestedDeliveryDate) ??
    30;

  let priorBulk = 0;
  if (row.buyerEmail) {
    priorBulk = await BulkInquiry.countDocuments({
      sellerId: row.sellerId,
      buyerEmail: row.buyerEmail,
      _id: { $ne: row._id },
    });
  }

  const buyerCity = row.buyerCity || "—";
  const customerTag = priorBulk > 0 ? "Returning Customer" : "New Customer";

  const sellerOrderStatus = inferSellerOrderStatus(row.status, row.sellerOrderStatus);

  const timeline = buildTimelineForResponse(
    row.statusTimeline,
    placedAt,
    requestedDeliveryDate
  );

  const primaryImage = product?.images?.[0] || row.productImage || "";

  return {
    _id: row._id,
    displayBulkRequestId,
    status: row.status,
    sellerOrderStatus,
    buyerType: row.buyerType || null,
    buyerTypeOptions: BUYER_TYPE_OPTIONS,
    customer: {
      name: row.buyerName,
      city: buyerCity,
      tag: `${buyerCity} | ${customerTag}`,
      email: row.buyerEmail,
      phone: row.buyerPhone,
      companyOrganisation: row.companyOrganisation || "—",
    },
    estimatedCost,
    estimatedCostFormatted: estimatedCost != null ? estimatedCost : null,
    requestedDeliveryDate,
    requestedDeliveryDateFormatted: formatDateOnly(requestedDeliveryDate),
    deliveryLeadDays: leadDays,
    deliveryLeadLabel: `${leadDays} days`,
    orderTypeLabel: "Bulk Order",
    product: {
      _id: productId,
      title: product?.title || row.productTitle || "—",
      images: product?.images || (row.productImage ? [row.productImage] : []),
      primaryImage,
    },
    variantLines,
    message: row.message || "",
    timeline,
    activeTimelineIndex: activeTimelineIndex(row.statusTimeline, sellerOrderStatus),
    buyerTypeUpdatedAt: row.buyerTypeUpdatedAt || row.updatedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export { BUYER_TYPE_OPTIONS };
