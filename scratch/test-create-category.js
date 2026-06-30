import "dotenv/config";
import mongoose from "mongoose";
import Category from "../models/Category.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    // Clean up if test category exists
    await Category.deleteOne({ slug: "test-category-xyz" });

    const newCat = new Category({
      name: "Test Category XYZ",
      slug: "test-category-xyz",
      commissionRate: 5,
      isActive: true,
      isFeatured: false
    });

    const saved = await newCat.save();
    console.log("Saved successfully:", saved);

    await Category.deleteOne({ _id: saved._id });
    console.log("Cleaned up successfully");
  } catch (error) {
    console.error("Error creating category:", error);
  } finally {
    await mongoose.disconnect();
  }
};

run();
