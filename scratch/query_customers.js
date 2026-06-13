import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
console.log('Connecting to:', mongoURI);

async function run() {
  await mongoose.connect(mongoURI);
  
  // count users by role
  const roles = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);
  console.log('Users by role:', roles);

  // find some customer users
  const customers = await User.find({ role: 'customer' }).limit(5);
  console.log('Sample customer users:', customers.map(c => ({
    id: c._id,
    email: c.email,
    status: c.status,
    role: c.role
  })));

  await mongoose.disconnect();
}

run().catch(console.error);
