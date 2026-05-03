import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,

    email: {
      type: String,
      unique: true,
      required: true,
    },

    mobile: String,

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "seller", "customer"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "kyc_submitted", "approved", "rejected"],
      default: "pending",
    },

    // ===============================
    // 🏢 SELLER PROFILE
    // ===============================
    businessName: String,
    address: String,
    city: String,
    state: String,
    pincode: String,

    // ===============================
    // 🔐 KYC FIELDS (NEW)
    // ===============================
    panNumber: String,
    aadhaarNumber: String,

    panImage: String,
    aadhaarImage: String,

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },

    // ===============================
    // 🔐 FORGOT PASSWORD
    // ===============================
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);