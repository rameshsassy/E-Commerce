import BulkInquiry from "../models/BulkInquiry.js";
import { formatOrderIdDate } from "./orderDisplayId.js";

/** Bulk Request ID: 2-digit sequence + DDMMYYYY — e.g. 0328052025 */
export async function generateBulkRequestId(sellerId, createdAt) {
  const count = await BulkInquiry.countDocuments({ sellerId });
  const seq = String(count + 1).padStart(2, "0");
  const datePart = formatOrderIdDate(createdAt);
  return `${seq}${datePart}`;
}
