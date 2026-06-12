import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const isPasswordSecure = (pw) => {
  if (typeof pw !== "string" || pw.length < 8) return false;
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSpecial = /[@$!%*?&#\-_+=\[\]{}|;:',.<>/?~`]/.test(pw);
  return hasUpper && hasLower && hasDigit && hasSpecial;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[1-9]\d{9,14}$/;

async function runTests() {
  console.log("--- Starting Tests ---");
  
  // Test password validations
  console.assert(isPasswordSecure("Strong123!") === true, "Password Strong123! should be secure");
  console.assert(isPasswordSecure("weak") === false, "Password weak should not be secure");
  console.assert(isPasswordSecure("NoSpecial123") === false, "Password NoSpecial123 should not be secure");
  console.assert(isPasswordSecure("no_digits_upper!") === false, "Password no_digits_upper! should not be secure");
  
  // Test email format regex
  console.assert(emailRegex.test("test@example.com") === true, "Email format check 1 failed");
  console.assert(emailRegex.test("invalid-email") === false, "Email format check 2 failed");
  
  // Test phone format regex
  console.assert(phoneRegex.test("1234567890") === true, "Phone format check 1 failed");
  console.assert(phoneRegex.test("+911234567890") === true, "Phone format check 2 failed");
  console.assert(phoneRegex.test("abc") === false, "Phone format check 3 failed");

  console.log("Regex and utility logic tests passed!");

  // Database checks
  if (process.env.MONGO_URI) {
    console.log("Connecting to database at:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB successfully.");

    // Clean up test user if exists
    const testEmail = "test_admin_temp@example.com";
    await User.deleteMany({ email: testEmail });
    console.log("Cleaned up old test admin user.");

    // Create a test user directly via model to test schema changes
    const hashedPassword = await bcrypt.hash("TestPass123!", 10);
    const user = await User.create({
      fullName: "Test Admin",
      firstName: "Test Admin",
      email: testEmail,
      phone: "9876543210",
      mobile: "9876543210",
      password: hashedPassword,
      role: "admin",
      status: "active",
      lastLogin: new Date(),
    });

    console.log("Created test admin user successfully. Object ID:", user._id);
    console.assert(user.fullName === "Test Admin", "fullName not saved correctly");
    console.assert(user.phone === "9876543210", "phone not saved correctly");
    console.assert(user.role === "admin", "role not saved correctly");
    console.assert(user.status === "active", "status not saved correctly");

    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log("Cleaned up created test admin user.");
    
    await mongoose.connection.close();
    console.log("DB connection closed.");
  } else {
    console.warn("MONGO_URI not configured in .env, skipping DB checks");
  }

  console.log("--- All Tests Succeeded! ---");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
