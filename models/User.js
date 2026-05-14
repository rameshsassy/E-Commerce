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
      enum: ["admin", "admin_staff", "seller", "customer"],
      required: true,
    },

    /** Sub-admin accounts created by primary admin */
    adminAccessLevel: {
      type: String,
      enum: ["full", "limited"],
    },
    adminAllowedSections: {
      type: [String],
      default: [],
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
    // 🚚 HYPERLOCAL DELIVERY
    // ===============================
    isHyperlocal: {
      type: Boolean,
      default: false,
    },
    deliverablePincodes: {
      type: [String],
      default: [],
    },

    // ===============================
    // 🔐 KYC FIELDS (NEW)
    // ===============================
    organizationLogo: String,
    elevatorPitch: String,
    officialName: String,
    entityType: {
      type: String,
      enum: ["entity 1", "entity 2"],
    },
    storeAddresses: {
      type: [String],
      default: [],
    },
    
    // Step 2 Documents
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

    // ===============================
    // 🌟 PREMIUM SELLER FIELDS
    // ===============================
    sellerType: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },
    bulkPurchaseEnabled: {
      type: Boolean,
      default: false,
    },
    subscriptionActive: {
      type: Boolean,
      default: false,
    },

    /** Last Razorpay order created for premium checkout (must match on verify). */
    pendingPremiumOrderId: { type: String, default: null },
    pendingPremiumOrderAt: { type: Date, default: null },
    /** Last successful premium payment id (support / audit). */
    premiumLastPaymentId: { type: String, default: null },

    // ===============================
    // 🔐 FORGOT PASSWORD
    // ===============================
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    // ===============================
    // 📧 EMAIL PREFERENCES (customer)
    // ===============================
    emailNewProductAlerts: {
      type: Boolean,
      default: false,
    },
    marketingEmailsEnabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);