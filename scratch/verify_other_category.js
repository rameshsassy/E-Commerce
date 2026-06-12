import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Category from "../models/Category.js";
import { createCategory } from "../controllers/category.controller.js";

async function runTest() {
  console.log("Starting Category controller 'Other (Please mention)' for Parent, Sub, and Type verification...");
  await connectDB();

  const customParentName = `Parent ${Date.now()}`;
  const customSubName = `Sub ${Date.now()}`;
  const customTypeName = `Type ${Date.now()}`;
  const categoryName = `Premium Product Category ${Date.now()}`;

  console.log(`Creating test category "${categoryName}"...`);
  
  let responseData = null;
  let responseStatus = null;

  const mockReq = {
    body: {
      name: categoryName,
      description: "Full taxonomy verification",
      parentCategory: "other",
      customParentCategory: customParentName,
      subCategory: "other",
      customSubCategory: customSubName,
      productType: "other",
      customProductType: customTypeName,
      commissionRate: 8,
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
  console.log("Response data:", responseData);

  if (responseStatus !== 201) {
    throw new Error(`Expected status 201, got ${responseStatus}`);
  }

  const catId = responseData.category._id;
  const parentId = responseData.category.parentCategory;

  if (!parentId) {
    throw new Error("Created category has no parentCategory ID resolved!");
  }

  // Find parent in DB
  const dbParent = await Category.findById(parentId);
  if (!dbParent) {
    throw new Error("Dynamic parent category was not found in database!");
  }
  console.log("Created Parent Category:", dbParent);
  if (dbParent.name !== customParentName) {
    throw new Error(`Expected parent category name to be "${customParentName}", got "${dbParent.name}"`);
  }

  // Find category in DB
  const dbCat = await Category.findById(catId);
  if (!dbCat) {
    throw new Error("Category record was not found in database!");
  }
  console.log("Created Category record:", dbCat);

  if (String(dbCat.parentCategory) !== String(parentId)) {
    throw new Error("Category's parentCategory ID does not match parent ID!");
  }

  if (dbCat.subCategory !== customSubName) {
    throw new Error(`Expected subCategory to resolve to custom sub name "${customSubName}", got "${dbCat.subCategory}"`);
  }

  if (dbCat.productType !== customTypeName) {
    throw new Error(`Expected productType to resolve to custom type name "${customTypeName}", got "${dbCat.productType}"`);
  }

  console.log("Taxonomy custom resolution checked: Parent, Sub, and Product Type resolved successfully.");

  // Cleanup
  console.log("Cleaning up test categories...");
  await Category.deleteOne({ _id: catId });
  await Category.deleteOne({ _id: parentId });
  console.log("Cleanup finished.");

  await mongoose.connection.close();
  console.log("Database connection closed. Test PASSED!");
}

runTest().catch((err) => {
  console.error("Test FAILED:", err);
  mongoose.connection.close();
  process.exit(1);
});
