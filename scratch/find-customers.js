import "dotenv/config";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const customers = await Customer.find().limit(5);
    console.log("Customers found:");
    customers.forEach(c => {
      console.log(`- ID: ${c._id}, Email: ${c.email}, Name: ${c.firstName} ${c.lastName}, Status: ${c.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
