import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Seller",
          required: true,
        },
        title: String,
        price: Number,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pinCode: String,
      landmark: String,
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0.0,
    },
    paymentInfo: {
      id: {
        type: String,
      },
      status: {
        type: String,
      },
      method: {
        type: String,
      },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
      default: "Processing",
    },
    deliveredAt: {
      type: Date,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    thankYouEmailSent: {
      type: Boolean,
      default: false,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    voucherCode: {
      type: String,
      default: null,
    },
    voucherDiscountAmount: {
      type: Number,
      default: 0,
    },
    // Reward integration
    rewardVoucherCode: {
      type: String,
      default: null,
    },
    rewardDiscountAmount: {
      type: Number,
      default: 0,
    },
    rewardProcessed: {
      type: Boolean,
      default: false,
    },
    isBuyNow: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.shippingAddress) {
      ret.shippingAddress.line1 = ret.shippingAddress.addressLine1;
      ret.shippingAddress.line2 = ret.shippingAddress.addressLine2;
      ret.shippingAddress.pincode = ret.shippingAddress.pinCode;
    }
    return ret;
  }
});

orderSchema.set("toObject", {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.shippingAddress) {
      ret.shippingAddress.line1 = ret.shippingAddress.addressLine1;
      ret.shippingAddress.line2 = ret.shippingAddress.addressLine2;
      ret.shippingAddress.pincode = ret.shippingAddress.pinCode;
    }
    return ret;
  }
});

orderSchema.index({ "items.seller": 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1 });

export default mongoose.model("Order", orderSchema);
