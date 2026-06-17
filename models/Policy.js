import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Policy title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Policy type is required"],
      enum: [
        "refund_policy",
        "return_policy",
        "replacement_policy",
        "terms_of_use",
        "shipping_policy",
        "seller_agreement",
      ],
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Policy content is required"],
    },
    status: {
      type: String,
      required: [true, "Policy status is required"],
      enum: ["active", "inactive"],
      default: "inactive",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

policySchema.index({ type: 1, status: 1 });

export default mongoose.model("Policy", policySchema);
