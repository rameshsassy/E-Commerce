import FormDraft from "../models/FormDraft.js";
import { assertValidFormKey } from "../utils/formDraftKeys.js";

function sanitizeDraftData(data) {
  if (data == null) return {};
  if (typeof data !== "object" || Array.isArray(data)) {
    const err = new Error("Draft data must be a JSON object.");
    err.statusCode = 400;
    throw err;
  }
  return data;
}

// GET /api/form-drafts/:formKey
export const getFormDraft = async (req, res) => {
  try {
    const formKey = assertValidFormKey(req.params.formKey);
    const draft = await FormDraft.findOne({
      userId: req.user._id,
      formKey,
    }).lean();

    res.json({
      draft: draft
        ? {
            formKey: draft.formKey,
            data: draft.data,
            updatedAt: draft.updatedAt,
          }
        : null,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// PUT /api/form-drafts/:formKey
export const upsertFormDraft = async (req, res) => {
  try {
    const formKey = assertValidFormKey(req.params.formKey);
    const data = sanitizeDraftData(req.body.data);

    const draft = await FormDraft.findOneAndUpdate(
      { userId: req.user._id, formKey },
      { data },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      message: "Draft auto-saved",
      autoSaved: true,
      draft: {
        formKey: draft.formKey,
        data: draft.data,
        updatedAt: draft.updatedAt,
      },
    });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};

// DELETE /api/form-drafts/:formKey
export const deleteFormDraft = async (req, res) => {
  try {
    const formKey = assertValidFormKey(req.params.formKey);
    await FormDraft.deleteOne({ userId: req.user._id, formKey });
    res.json({ message: "Draft cleared" });
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
  }
};
