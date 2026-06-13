import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
console.log('Connecting to:', mongoURI);

async function run() {
  await mongoose.connect(mongoURI);
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name));

  const db = mongoose.connection.db;
  const indexes = await db.collection('users').indexes();
  console.log('Indexes on users collection:');
  console.log(JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
