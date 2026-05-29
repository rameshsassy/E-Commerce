import KycEntityType from "../models/KycEntityType.js";
import {
  DEFAULT_KYC_ENTITY_TYPES,
  OTHERS_ENTITY_CODE,
} from "../data/kycEntityTypesSeed.js";

export async function ensureKycEntityTypesSeeded() {
  let inserted = 0;
  for (const row of DEFAULT_KYC_ENTITY_TYPES) {
    const result = await KycEntityType.updateOne(
      { code: row.code },
      {
        $setOnInsert: {
          code: row.code,
          label: row.label,
          sortOrder: row.sortOrder,
          requiresOtherText: Boolean(row.requiresOtherText),
          isSystem: true,
          isActive: true,
        },
      },
      { upsert: true }
    );
    if (result.upsertedCount) inserted += 1;
  }
  if (inserted > 0) {
    console.log(`[kyc] Seeded ${inserted} default entity type(s)`);
  }
}

export async function listActiveKycEntityTypes() {
  return KycEntityType.find({ isActive: true })
    .sort({ sortOrder: 1, label: 1 })
    .lean();
}

export async function listAllKycEntityTypes() {
  return KycEntityType.find({})
    .sort({ sortOrder: 1, label: 1 })
    .lean();
}

export async function findKycEntityTypeByCode(code) {
  if (!code) return null;
  return KycEntityType.findOne({
    code: String(code).trim().toLowerCase(),
    isActive: true,
  }).lean();
}

export function slugifyEntityCode(label) {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 80);
}

/**
 * Validate seller KYC entity type + optional other text.
 */
export async function validateSellerEntityType(entityType, entityTypeOther) {
  const code = String(entityType || "").trim().toLowerCase();
  if (!code) {
    return { ok: false, message: "Entity type is required." };
  }

  const row = await findKycEntityTypeByCode(code);
  if (!row) {
    return { ok: false, message: "Invalid entity type. Please select from the list." };
  }

  if (row.requiresOtherText || code === OTHERS_ENTITY_CODE) {
    const other = String(entityTypeOther || "").trim();
    if (!other) {
      return {
        ok: false,
        message: "Please specify your entity type under Others.",
      };
    }
  }

  return { ok: true, row };
}

export function formatEntityTypeDisplay(entityType, entityTypeOther, labelFromDb) {
  if (labelFromDb) return labelFromDb;
  const code = String(entityType || "").toLowerCase();
  if (code === OTHERS_ENTITY_CODE && entityTypeOther) {
    return `Others: ${entityTypeOther}`;
  }
  const hit = DEFAULT_KYC_ENTITY_TYPES.find((t) => t.code === code);
  return hit?.label || entityType || "N/A";
}
