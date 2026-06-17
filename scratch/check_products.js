import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";

async function run() {
  const uri = process.env.MONGO_URI;
  console.log("Connecting to", uri);
  await mongoose.connect(uri);
  const products = await Product.find({}).select("title images isDraft approvalStatus").lean();
  console.log("Found products count:", products.length);
  console.log("Products detail:", JSON.stringify(products, null, 2));
  await mongoose.connection.close();
}

run().catch(console.error);
