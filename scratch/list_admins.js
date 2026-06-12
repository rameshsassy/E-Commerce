import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";

// Define a minimal User Schema
const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  firstName: String,
  lastName: String,
  adminAccessLevel: String,
  adminAllowedSections: [String]
}, { collection: "users" });

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  await connectDB();
  console.log("Listing admin accounts in local database...");

  const admins = await User.find({ role: { $in: ["admin", "admin_staff"] } });
  
  if (admins.length === 0) {
    console.log("WARNING: No accounts with role 'admin' or 'admin_staff' found in the database!");
    console.log("Please run 'npm run seed' to populate default admin accounts.");
  } else {
    console.log(`Found ${admins.length} administrator account(s):`);
    admins.forEach((admin, i) => {
      console.log(`[${i + 1}] Email: ${admin.email} | Role: ${admin.role} | Access Level: ${admin.adminAccessLevel || "N/A"}`);
    });
  }

  await mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  mongoose.connection.close();
});
