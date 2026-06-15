import mongoose from "mongoose";

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
    },
    pan: String,
    aadhaar: String,
    gst: String,
    bankAccount: String,
    licenseFile: String,
    addressProofFile: String,

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("KYC", kycSchema);