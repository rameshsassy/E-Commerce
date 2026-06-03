import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Connect to MongoDB
const MONGO_URI = "mongodb+srv://badimi:Badimi%40001@cluster0.se90cmb.mongodb.net";
const JWT_SECRET = "secret123";

async function runTests() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected successfully!");

  try {
    // Clean up existing test users if they exist
    await User.deleteMany({ email: { $in: [
      "test_admin@example.com",
      "test_seller@example.com",
      "test_customer@example.com",
      "test_subadmin@example.com"
    ]}});

    // 1. Create Users
    console.log("Creating test users...");
    const hashedPassword = await bcrypt.hash("Password123!", 10);

    const admin = await User.create({
      firstName: "Test",
      lastName: "Admin",
      email: "test_admin@example.com",
      password: hashedPassword,
      role: "admin",
      status: "approved"
    });

    const seller = await User.create({
      firstName: "Test",
      lastName: "Seller",
      businessName: "Test Seller Business",
      email: "test_seller@example.com",
      password: hashedPassword,
      role: "seller",
      status: "approved"
    });

    const customer = await User.create({
      firstName: "Test",
      lastName: "Customer",
      email: "test_customer@example.com",
      password: hashedPassword,
      role: "customer",
      status: "approved"
    });

    const subadmin = await User.create({
      firstName: "Test",
      lastName: "SubAdmin",
      email: "test_subadmin@example.com",
      password: hashedPassword,
      role: "admin_staff",
      adminAccessLevel: "limited",
      adminAllowedSections: ["dashboard"],
      status: "approved"
    });

    console.log("Users created successfully!");

    // Helper to request local API
    const baseUrl = "http://localhost:5000/api";

    const login = async (email, role) => {
      const portal = role === "seller" ? "seller" : "customer";
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Portal": portal
        },
        body: JSON.stringify({ email, password: "Password123!", portal })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
      return data.token;
    };

    console.log("Logging in users via REST API...");
    const adminToken = await login("test_admin@example.com", "admin");
    const sellerToken = await login("test_seller@example.com", "seller");
    const customerToken = await login("test_customer@example.com", "customer");
    const subadminToken = await login("test_subadmin@example.com", "admin_staff");

    console.log("All users logged in. Tokens generated.");

    // Helper for requests
    const apiRequest = async (url, method, token, body = null, role = null) => {
      const portal = role === "seller" ? "seller" : "customer";
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Portal": portal
        }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${baseUrl}${url}`, options);
      const data = await res.json();
      return { status: res.status, data };
    };

    // 2. Customer chats with Admin
    console.log("\n--- Testing Customer-Admin Chat ---");
    let res = await apiRequest("/chat/conversations", "POST", customerToken, {
      type: "customer_admin"
    });
    console.log("Create Conversation status:", res.status);
    console.log("Conversation type:", res.data.conversation?.type);
    const customerAdminConvoId = res.data.conversation._id;

    // Send message as Customer
    res = await apiRequest(`/chat/conversations/${customerAdminConvoId}/messages`, "POST", customerToken, {
      text: "Hello admin, I need help with my account."
    });
    console.log("Send message as customer status:", res.status);
    console.log("Sent message content:", res.data.messageData?.text);

    // Read message as Admin
    res = await apiRequest(`/chat/conversations/${customerAdminConvoId}/messages`, "GET", adminToken);
    console.log("Get messages as admin status:", res.status);
    console.log("First message content:", res.data.messages?.[0]?.text);

    // 3. Customer chats with Seller
    console.log("\n--- Testing Customer-Seller Chat ---");
    res = await apiRequest("/chat/conversations", "POST", customerToken, {
      type: "customer_seller",
      sellerId: seller._id
    });
    console.log("Create Customer-Seller Convo status:", res.status);
    const customerSellerConvoId = res.data.conversation._id;

    res = await apiRequest(`/chat/conversations/${customerSellerConvoId}/messages`, "POST", customerToken, {
      text: "Hi seller, is this product available?"
    });
    console.log("Send message to seller status:", res.status);

    res = await apiRequest(`/chat/conversations/${customerSellerConvoId}/messages`, "GET", sellerToken, null, "seller");
    console.log("Get messages as seller status:", res.status);
    console.log("Message text:", res.data.messages?.[0]?.text);

    // 4. Customer chats with Both (Admin & Seller)
    console.log("\n--- Testing Customer-Both Group Chat ---");
    res = await apiRequest("/chat/conversations", "POST", customerToken, {
      type: "customer_both",
      sellerId: seller._id
    });
    console.log("Create Customer-Both Convo status:", res.status);
    const customerBothConvoId = res.data.conversation._id;

    res = await apiRequest(`/chat/conversations/${customerBothConvoId}/messages`, "POST", customerToken, {
      text: "Hello admin and seller, my order is missing."
    });
    console.log("Send message status:", res.status);

    // Verify Admin can see customer_both convo
    res = await apiRequest(`/chat/conversations/${customerBothConvoId}/messages`, "GET", adminToken);
    console.log("Get messages as admin status:", res.status);

    // Verify Seller can see customer_both convo
    res = await apiRequest(`/chat/conversations/${customerBothConvoId}/messages`, "GET", sellerToken, null, "seller");
    console.log("Get messages as seller status:", res.status);

    // 5. Seller chats with Admin
    console.log("\n--- Testing Seller-Admin Chat ---");
    res = await apiRequest("/chat/conversations", "POST", sellerToken, {
      type: "seller_admin"
    }, "seller");
    console.log("Create Seller-Admin Convo status:", res.status);
    const sellerAdminConvoId = res.data.conversation._id;

    res = await apiRequest(`/chat/conversations/${sellerAdminConvoId}/messages`, "POST", sellerToken, {
      text: "Hello admin, I want to update my bank details."
    }, "seller");
    console.log("Send message status:", res.status);

    // 6. Admin assigns Chat to Sub-Admin (admin_staff)
    console.log("\n--- Testing Admin Chat Assignment ---");
    res = await apiRequest(`/chat/conversations/${customerAdminConvoId}/assign`, "POST", adminToken, {
      staffId: subadmin._id
    });
    console.log("Assign convo status:", res.status);
    console.log("Assigned to:", res.data.conversation?.assignedTo?.firstName);

    // 7. Sub-Admin accesses assigned chat
    console.log("\n--- Testing Sub-Admin Access to Assigned Chat ---");
    res = await apiRequest(`/chat/conversations/${customerAdminConvoId}/messages`, "GET", subadminToken);
    console.log("Get messages as assigned sub-admin status:", res.status);
    console.log("Number of messages:", res.data.messages?.length);

    res = await apiRequest(`/chat/conversations/${customerAdminConvoId}/messages`, "POST", subadminToken, {
      text: "Hello customer, I am sub-admin helping you today."
    });
    console.log("Send message as assigned sub-admin status:", res.status);

    // 8. Sub-Admin tries to access UNASSIGNED chat (should fail with 403)
    console.log("\n--- Testing Sub-Admin Access to UNASSIGNED Chat (Should fail with 403) ---");
    res = await apiRequest(`/chat/conversations/${customerBothConvoId}/messages`, "GET", subadminToken);
    console.log("Get unassigned messages status (should be 403):", res.status);
    console.log("Get unassigned message response:", res.data);

    res = await apiRequest(`/chat/conversations/${customerBothConvoId}/messages`, "POST", subadminToken, {
      text: "Trying to hijack this conversation"
    });
    console.log("Send unassigned message status (should be 403):", res.status);
    console.log("Send unassigned message response:", res.data);

    // 9. Sub-Admin lists conversations
    console.log("\n--- Testing Sub-Admin List Conversations ---");
    res = await apiRequest("/chat/conversations", "GET", subadminToken);
    console.log("List conversations status:", res.status);
    console.log("Conversations fetched count:", res.data.conversations?.length);
    console.log("Conversation IDs fetched:", res.data.conversations?.map(c => c._id));

    // Clean up
    console.log("\nCleaning up test data...");
    await User.deleteMany({ email: { $in: [
      "test_admin@example.com",
      "test_seller@example.com",
      "test_customer@example.com",
      "test_subadmin@example.com"
    ]}});
    console.log("Done clean up!");

  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests();
