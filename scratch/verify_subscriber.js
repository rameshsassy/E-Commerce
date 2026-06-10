import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import Subscriber from "../models/Subscriber.js";
import User from "../models/User.js";
import { subscribeToNewsletter } from "../controllers/newsletter.controller.js";

async function runTest() {
  console.log("Starting backend verification...");
  await connectDB();

  const testEmail = `test-subscriber-${Date.now()}@example.com`;
  console.log(`Using test email: ${testEmail}`);

  // 1. Create a dummy user with the same email to test marketing preference syncing
  console.log("Creating dummy user for syncing test...");
  const dummyUser = new User({
    firstName: "Test",
    lastName: "User",
    email: testEmail,
    password: "password123",
    role: "customer",
    marketingEmailsEnabled: false,
  });
  await dummyUser.save();
  console.log("Dummy user created with marketingEmailsEnabled = false.");

  // 2. Test controller logic by calling it with mock request/response
  console.log("Invoking subscribeToNewsletter controller...");
  let responseData = null;
  let responseStatus = null;

  const mockReq = {
    body: { email: testEmail }
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

  await subscribeToNewsletter(mockReq, mockRes);
  console.log(`Controller response status: ${responseStatus}`);
  console.log("Controller response data:", responseData);

  // Assertions
  if (responseStatus !== 201) {
    throw new Error(`Expected status 201, got ${responseStatus}`);
  }

  // 3. Verify database insertion
  const foundSubscriber = await Subscriber.findOne({ email: testEmail });
  if (!foundSubscriber) {
    throw new Error("Subscriber record was not saved in MongoDB!");
  }
  console.log("Verified: Subscriber saved successfully in the database.");

  // 4. Verify marketing preference sync
  const updatedUser = await User.findOne({ email: testEmail });
  if (!updatedUser.marketingEmailsEnabled) {
    throw new Error("User's marketing preference was not updated to true!");
  }
  console.log("Verified: User's marketingEmailsEnabled synced to true.");

  // 5. Test duplicate subscription
  console.log("Testing duplicate subscription...");
  await subscribeToNewsletter(mockReq, mockRes);
  console.log(`Duplicate response status: ${responseStatus}`);
  console.log("Duplicate response data:", responseData);

  if (responseStatus !== 200 || !responseData.alreadySubscribed) {
    throw new Error("Duplicate email handling failed!");
  }
  console.log("Verified: Duplicate email handled gracefully.");

  // Cleanup
  console.log("Cleaning up test data...");
  await Subscriber.deleteOne({ email: testEmail });
  await User.deleteOne({ email: testEmail });
  console.log("Cleanup finished.");

  await mongoose.connection.close();
  console.log("Database connection closed. Test PASSED!");
}

runTest().catch((err) => {
  console.error("Test FAILED:", err);
  mongoose.connection.close();
  process.exit(1);
});
