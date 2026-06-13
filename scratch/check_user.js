import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
console.log('Connecting to:', mongoURI);

async function run() {
  await mongoose.connect(mongoURI);
  const sellers = await User.find({ role: 'seller' });
  console.log(`Found ${sellers.length} sellers:`);
  for (const s of sellers) {
    console.log({
      id: s._id,
      email: s.email,
      sellerType: s.sellerType,
      subscriptionPlan: s.subscriptionPlan,
      subscriptionActive: s.subscriptionActive,
      subscriptionValidUntil: s.subscriptionValidUntil,
    });
  }
  await mongoose.disconnect();
}

run().catch(console.error);
