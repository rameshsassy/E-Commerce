import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import { getSellerCategoryLimitsForApi } from "../utils/sellerCategoryRules.js";

async function runTest() {
  console.log("Starting verification of dynamic database categories in seller taxonomy...");
  await connectDB();

  const tempCategoryName = `Prabodh-${Date.now()}`;
  console.log(`Inserting temporary root category: "${tempCategoryName}"...`);

  const category = new Category({
    name: tempCategoryName,
    slug: tempCategoryName.toLowerCase(),
    commissionRate: 5,
    isActive: true,
    parentCategory: null,
    subCategory: null,
    productType: null
  });

  await category.save();

  // Create a mock seller object
  const mockSeller = {
    _id: new mongoose.Types.ObjectId(),
    sellerType: "free"
  };

  console.log("Retrieving seller category limits...");
  const limits = await getSellerCategoryLimitsForApi(mockSeller);

  console.log("Category mains in taxonomy:", limits.taxonomy.mains);

  const found = limits.taxonomy.mains.includes(tempCategoryName);

  // Clean up
  await Category.deleteOne({ _id: category._id });
  await mongoose.connection.close();

  if (found) {
    console.log("SUCCESS: Category was dynamically resolved and presented in the seller taxonomy!");
    console.log("Test PASSED!");
  } else {
    throw new Error(`Category "${tempCategoryName}" was NOT found in the seller taxonomy!`);
  }
}

runTest().catch((err) => {
  console.error("Test FAILED:", err);
  mongoose.connection.close();
  process.exit(1);
});
