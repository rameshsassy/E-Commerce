import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    templateType: {
      type: String,
      required: true,
      index: true,
    },
    to: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    errorMessage: { type: String, default: "" },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ templateType: 1, to: 1, createdAt: -1 });

export default mongoose.model("EmailLog", emailLogSchema);
