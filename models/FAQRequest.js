import mongoose from "mongoose";

const faqRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    userType: {
      type: String,
      required: [true, "User type is required"],
      enum: ["Customer", "Seller"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    question: {
      type: String,
      required: [true, "Question is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Answered", "Rejected"],
      default: "Pending",
    },
    answer: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

faqRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("FAQRequest", faqRequestSchema);
