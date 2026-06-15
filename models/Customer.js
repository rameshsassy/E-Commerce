import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
    },
    fullName: String,
    firstName: String,
    lastName: String,

    email: {
      type: String,
      unique: true,
      required: true,
    },

    mobile: String,
    phone: String,

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["customer"],
      default: "customer",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "kyc_submitted", "approved", "rejected", "active"],
      default: "approved",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    emailNewProductAlerts: {
      type: Boolean,
      default: false,
    },
    marketingEmailsEnabled: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Customer", customerSchema, "customers");
