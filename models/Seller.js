import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    sellerId: {
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
      enum: ["seller"],
      default: "seller",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "kyc_submitted", "approved", "rejected", "active"],
      default: "pending",
    },

    businessName: String,
    address: String,
    city: String,
    state: String,
    pincode: String,
    
    isHyperlocal: {
      type: Boolean,
      default: false,
    },
    deliverablePincodes: {
      type: [String],
      default: [],
    },

    organizationLogo: String,
    elevatorPitch: String,
    officialName: String,
    entityType: {
      type: String,
      trim: true,
      lowercase: true,
    },
    entityTypeOther: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    storeAddresses: {
      type: [String],
      default: [],
    },
    
    dateOfRegistration: Date,
    adminCostPercentage: Number,
    registrationNumber: String,
    registrationCertificate: String,
    orgPanNumber: String,
    orgPanImage: String,
    cancelledCheckImage: String,
    gstNumber: String,
    gstImage: String,
    
    agreedToTerms: {
      type: Boolean,
      default: false,
    },

    panNumber: String,
    aadhaarNumber: String,

    panImage: String,
    aadhaarImage: String,

    kycStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },

    sellerType: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    subscriptionPlan: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free",
    },
    subscriptionValidUntil: {
      type: Date,
      default: null,
    },
    bulkPurchaseEnabled: {
      type: Boolean,
      default: false,
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },

    pendingPremiumOrderId: { type: String, default: null },
    pendingPremiumOrderAt: { type: Date, default: null },
    premiumLastPaymentId: { type: String, default: null },

    sellerReferralCode: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    referralSignups: {
      type: Number,
      default: 0,
    },
    referredBySellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      default: null,
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,
    lastLogin: Date,
  },
  { timestamps: true }
);

sellerSchema.index({ referredBySellerId: 1 }, { sparse: true });

export default mongoose.model("Seller", sellerSchema, "sellers");
