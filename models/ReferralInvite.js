import mongoose from "mongoose";

const referralInviteSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },
    inviteeEmail: {
      type: String,
      required: true,
      index: true,
    },
    inviteeFirstName: { type: String, required: true },
    inviteeLastName: { type: String, default: "" },
    inviteeVenture: { type: String, default: "" },
    inviteeContact: { type: String, default: "" },
    inviteeDesignation: { type: String, default: "" },
    inviteeType: { type: String, default: "" },
    status: {
      type: String,
      enum: ["sent", "signed_up"],
      default: "sent",
      index: true,
    },
    followUpCount: {
      type: Number,
      default: 0,
    },
    lastFollowUpSentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

referralInviteSchema.index({ inviteeEmail: 1, referrerId: 1 }, { unique: true });

export default mongoose.model("ReferralInvite", referralInviteSchema);
