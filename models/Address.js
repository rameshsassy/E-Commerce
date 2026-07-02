import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pinCode: {
      type: String,
      required: true,
    },
    landmark: {
      type: String,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

addressSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.line1 = ret.addressLine1;
    ret.line2 = ret.addressLine2;
    ret.pincode = ret.pinCode;
    return ret;
  }
});

addressSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.line1 = ret.addressLine1;
    ret.line2 = ret.addressLine2;
    ret.pincode = ret.pinCode;
    return ret;
  }
});

export default mongoose.model("Address", addressSchema);
