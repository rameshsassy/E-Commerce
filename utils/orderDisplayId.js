import Shipment from "../models/Shipment.js";

/** First word of seller business name (or name), up to 3 letters — e.g. "FAT" */
export function buildOrderIdPrefix(seller) {
  const raw = String(seller?.businessName || seller?.firstName || "ORD").trim();
  const firstWord = raw.split(/\s+/).filter(Boolean)[0] || "ORD";
  const letters = firstWord.replace(/[^a-zA-Z]/g, "");
  const base = (letters || "ORD").slice(0, 3).toUpperCase();
  return base.padEnd(3, "X");
}

/** DDMMYYYY from order placed date */
export function formatOrderIdDate(orderCreatedAt) {
  const d = new Date(orderCreatedAt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
}

/**
 * Unique display id: PREFIX + 2-digit sequence + DDMMYYYY
 * Example: FAT0128052026
 */
export async function generateDisplayOrderId(seller, orderCreatedAt) {
  const prefix = buildOrderIdPrefix(seller);
  const datePart = formatOrderIdDate(orderCreatedAt);
  const sequence = await Shipment.countDocuments({ seller: seller._id });
  const seq = String(sequence + 1).padStart(2, "0");
  return `${prefix}${seq}${datePart}`;
}
