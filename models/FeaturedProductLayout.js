import mongoose from "mongoose";

const featuredProductLayoutSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Layout title is required"],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    layoutType: {
      type: String,
      required: [true, "Layout type is required"],
      enum: ["grid", "carousel", "horizontal_scroll", "banner_products"],
    },
    selectedProducts: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        displayOrder: {
          type: Number,
          default: 0,
        },
      },
    ],
    settings: {
      productsPerRow: {
        type: Number,
        default: 4,
      },
      maxProducts: {
        type: Number,
        default: 8,
      },
      showTitle: {
        type: Boolean,
        default: true,
      },
      showSubtitle: {
        type: Boolean,
        default: true,
      },
      showPrice: {
        type: Boolean,
        default: true,
      },
      showSellerName: {
        type: Boolean,
        default: true,
      },
      showRating: {
        type: Boolean,
        default: true,
      },
      showAddToCart: {
        type: Boolean,
        default: true,
      },
      showOrderNow: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["active", "inactive"],
      default: "inactive",
    },
    displayOrder: {
      type: Number,
      default: 0,
      required: true,
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

featuredProductLayoutSchema.index({ status: 1, displayOrder: 1 });

export default mongoose.model("FeaturedProductLayout", featuredProductLayoutSchema);
