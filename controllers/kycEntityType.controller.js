import KycEntityType from "../models/KycEntityType.js";
import {
  listActiveKycEntityTypes,
  listAllKycEntityTypes,
  slugifyEntityCode,
} from "../utils/kycEntityTypes.js";

/** GET /api/seller/kyc/entity-types — active types for KYC form */
export const listSellerKycEntityTypes = async (req, res) => {
  try {
    const types = await listActiveKycEntityTypes();
    res.json({ count: types.length, entityTypes: types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** GET /api/admin/kyc-entity-types */
export const listAdminKycEntityTypes = async (req, res) => {
  try {
    const types = await listAllKycEntityTypes();
    res.json({ count: types.length, entityTypes: types });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** POST /api/admin/kyc-entity-types */
export const createKycEntityType = async (req, res) => {
  try {
    const { label, requiresOtherText, isActive, sortOrder } = req.body;
    const trimmed = String(label || "").trim();
    if (!trimmed) {
      return res.status(400).json({ message: "Label is required." });
    }

    let code = slugifyEntityCode(req.body.code || trimmed);
    if (!code) {
      return res.status(400).json({ message: "Could not generate a valid code." });
    }

    const exists = await KycEntityType.findOne({ code });
    if (exists) {
      return res.status(400).json({ message: "An entity type with this code already exists." });
    }

    const maxOrder = await KycEntityType.findOne({}).sort({ sortOrder: -1 }).select("sortOrder");
    const nextOrder =
      sortOrder != null && Number.isFinite(Number(sortOrder))
        ? Number(sortOrder)
        : (maxOrder?.sortOrder ?? 0) + 1;

    const created = await KycEntityType.create({
      code,
      label: trimmed,
      requiresOtherText: Boolean(requiresOtherText),
      isActive: isActive !== false,
      sortOrder: nextOrder,
      isSystem: false,
    });

    res.status(201).json({ message: "Entity type created", entityType: created });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Duplicate entity type code." });
    }
    res.status(500).json({ message: error.message });
  }
};

/** PATCH /api/admin/kyc-entity-types/:id */
export const updateKycEntityType = async (req, res) => {
  try {
    const row = await KycEntityType.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Entity type not found" });
    }

    if (req.body.label != null) {
      const trimmed = String(req.body.label).trim();
      if (!trimmed) {
        return res.status(400).json({ message: "Label cannot be empty." });
      }
      row.label = trimmed;
    }
    if (req.body.requiresOtherText != null) {
      row.requiresOtherText = Boolean(req.body.requiresOtherText);
    }
    if (req.body.isActive != null) {
      row.isActive = Boolean(req.body.isActive);
    }
    if (req.body.sortOrder != null) {
      const n = Number(req.body.sortOrder);
      if (Number.isFinite(n)) row.sortOrder = n;
    }

    await row.save();
    res.json({ message: "Entity type updated", entityType: row });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/** DELETE /api/admin/kyc-entity-types/:id — soft-deactivate system types, hard-delete custom */
export const deleteKycEntityType = async (req, res) => {
  try {
    const row = await KycEntityType.findById(req.params.id);
    if (!row) {
      return res.status(404).json({ message: "Entity type not found" });
    }

    if (row.isSystem) {
      row.isActive = false;
      await row.save();
      return res.json({
        message: "System entity type deactivated (cannot be permanently deleted).",
        entityType: row,
      });
    }

    await row.deleteOne();
    res.json({ message: "Entity type deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
