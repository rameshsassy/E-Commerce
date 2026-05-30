import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  deleteFormDraft,
  getFormDraft,
  upsertFormDraft,
} from "../controllers/formDraft.controller.js";

const router = express.Router();

router.get("/:formKey", protect, getFormDraft);
router.put("/:formKey", protect, upsertFormDraft);
router.delete("/:formKey", protect, deleteFormDraft);

export default router;
