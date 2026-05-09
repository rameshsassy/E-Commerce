import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Product from "./models/Product.js";
import User from "./models/User.js";

async function test() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce");
  
  try {
    const p = new Product({
      sellerId: new mongoose.Types.ObjectId(),
      title: "Test",
      description: "Test desc",
      price: 10,
      category: "Category 1",
      locations: [{ address: "", stock: 0 }]
    });
    await p.save();
    console.log("Success!");
  } catch (err) {
    console.error("Error saving:", err.message);
  }
  process.exit(0);
}
test();
