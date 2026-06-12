import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import { createCategory, updateCategory } from "../controllers/category.controller.js";

async function runTest() {
  console.log("Starting Category database & controller verification...");
  await connectDB();

  // Find a category to use as parentCategory
  const mainCat = await Category.findOne({ parentCategory: null });
  if (!mainCat) {
    throw new Error("No root category found in the database. Please run npm run seed first.");
  }
  console.log(`Using existing root category "${mainCat.name}" (ID: ${mainCat._id}) as parentCategory.`);

  const testName = `Test Category ${Date.now()}`;
  console.log(`Test Category name: ${testName}`);

  // 1. Verify Create Category Controller
  console.log("Creating test category via createCategory controller...");
  let responseData = null;
  let responseStatus = null;

  const mockReq = {
    body: {
      name: testName,
      description: "Verification category description",
      parentCategory: mainCat._id.toString(),
      subCategory: "Women’s wear",
      productType: "Saree",
      commissionRate: 7,
      isActive: true,
      isFeatured: false
    }
  };

  const mockRes = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  await createCategory(mockReq, mockRes);
  console.log(`Create controller status: ${responseStatus}`);
  console.log("Create controller response data:", responseData);

  if (responseStatus !== 201) {
    throw new Error(`Expected status 201, got ${responseStatus}`);
  }

  const createdId = responseData.category._id;

  // 2. Verify creation fields in MongoDB
  const dbCat = await Category.findById(createdId);
  if (!dbCat) {
    throw new Error("Category record was not saved in MongoDB!");
  }
  console.log("Found category in DB:", dbCat);

  if (dbCat.subCategory !== "Women’s wear") {
    throw new Error(`Expected subCategory to be "Women’s wear", got "${dbCat.subCategory}"`);
  }
  if (dbCat.productType !== "Saree") {
    throw new Error(`Expected productType to be "Saree", got "${dbCat.productType}"`);
  }
  if (String(dbCat.parentCategory) !== String(mainCat._id)) {
    throw new Error("parentCategory did not match mainCat id");
  }
  console.log("Verified: Category creation and taxonomy fields saved successfully in database.");

  // 3. Verify Update Category Controller
  console.log("Updating test category via updateCategory controller...");
  const updateReq = {
    params: { id: createdId },
    body: {
      subCategory: "Men’s wear",
      productType: "Shirt",
      commissionRate: 12
    }
  };

  let updateStatus = null;
  let updateData = null;
  const updateRes = {
    status(code) {
      updateStatus = code;
      return this;
    },
    json(data) {
      updateData = data;
      return this;
    }
  };

  await updateCategory(updateReq, updateRes);
  console.log(`Update controller status: ${updateStatus}`);

  const updatedDbCat = await Category.findById(createdId);
  console.log("Found updated category in DB:", updatedDbCat);

  if (updatedDbCat.subCategory !== "Men’s wear") {
    throw new Error(`Expected updated subCategory to be "Men’s wear", got "${updatedDbCat.subCategory}"`);
  }
  if (updatedDbCat.productType !== "Shirt") {
    throw new Error(`Expected updated productType to be "Shirt", got "${updatedDbCat.productType}"`);
  }
  if (updatedDbCat.commissionRate !== 12) {
    throw new Error(`Expected updated commissionRate to be 12, got ${updatedDbCat.commissionRate}`);
  }
  console.log("Verified: Category update and taxonomy modifications saved successfully in database.");

  // Cleanup
  console.log("Cleaning up test category...");
  await Category.deleteOne({ _id: createdId });
  console.log("Cleanup finished.");

  await mongoose.connection.close();
  console.log("Database connection closed. Test PASSED!");
}

runTest().catch((err) => {
  console.error("Test FAILED:", err);
  mongoose.connection.close();
  process.exit(1);
});
