import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Seller from "../models/Seller.js";
import Customer from "../models/Customer.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to DB!");
  const usersCount = await User.countDocuments();
  const sellersCount = await Seller.countDocuments();
  const customersCount = await Customer.countDocuments();
  console.log(`Users count in 'users' collection: ${usersCount}`);
  console.log(`Sellers count in 'sellers' collection: ${sellersCount}`);
  console.log(`Customers count in 'customers' collection: ${customersCount}`);

  // Fetch one seller from each collection to see
  const sampleSellerInUsers = await User.findOne({ role: "seller" });
  const sampleSellerInSellers = await Seller.findOne({});
  console.log("Sample Seller in Users collection:", sampleSellerInUsers ? { id: sampleSellerInUsers._id, email: sampleSellerInUsers.email } : "None");
  console.log("Sample Seller in Sellers collection:", sampleSellerInSellers ? { id: sampleSellerInSellers._id, email: sampleSellerInSellers.email } : "None");

  await mongoose.disconnect();
}

run().catch(console.error);
