import mongoose from "mongoose";

const formDraftSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    formKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

formDraftSchema.index({ userId: 1, formKey: 1 }, { unique: true });

export default mongoose.model("FormDraft", formDraftSchema);
