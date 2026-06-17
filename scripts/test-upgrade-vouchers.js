import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import AdminVoucher from "../models/AdminVoucher.js";
import VoucherUsage from "../models/VoucherUsage.js";
import { upgradeSellerToPremiumManual } from "../controllers/seller.controller.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

const runTests = async () => {
  try {
    console.log(`Connecting to MongoDB...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!\n");

    // Clean up existing test data
    console.log("Cleaning up old test data...");
    const testEmail = "test-seller-vouchers@aashansh.org";
    await User.deleteMany({ email: testEmail });
    await AdminVoucher.deleteMany({ voucherCode: { $in: [
      "TEST_PRO_50", "TEST_PREM_20000", "TEST_EXPIRED", "TEST_INACTIVE", "TEST_LIMIT", "TEST_CUSTOMER", "TEST_PRO_100"
    ]}});
    await VoucherUsage.deleteMany({ voucherCode: { $in: [
      "TEST_PRO_50", "TEST_PREM_20000", "TEST_EXPIRED", "TEST_INACTIVE", "TEST_LIMIT", "TEST_CUSTOMER", "TEST_PRO_100"
    ]}});

    // Setup Test User
    const testSeller = await User.create({
      firstName: "Test",
      lastName: "Seller",
      email: testEmail,
      mobile: "9876543210",
      password: "dummyhashedpassword",
      role: "seller",
      status: "approved",
      sellerType: "free",
      subscriptionPlan: "free",
      subscriptionActive: false,
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Setup Test Vouchers
    await AdminVoucher.create([
      {
        voucherCode: "TEST_PRO_50",
        voucherType: "seller_subscription",
        discountType: "percent",
        discountValue: 50,
        expiry: tomorrow,
        isActive: true,
        usageLimit: 10,
        selectedPlans: ["pro"],
      },
      {
        voucherCode: "TEST_PRO_100",
        voucherType: "seller_subscription",
        discountType: "percent",
        discountValue: 100,
        expiry: tomorrow,
        isActive: true,
        usageLimit: 10,
        selectedPlans: ["pro"],
      },
      {
        voucherCode: "TEST_PREM_20000",
        voucherType: "seller_subscription",
        discountType: "flat",
        discountValue: 20000,
        expiry: tomorrow,
        isActive: true,
        usageLimit: 5,
        selectedPlans: ["premium"],
      },
      {
        voucherCode: "TEST_EXPIRED",
        voucherType: "seller_subscription",
        discountType: "percent",
        discountValue: 10,
        expiry: yesterday,
        isActive: true,
        selectedPlans: ["pro", "premium"],
      },
      {
        voucherCode: "TEST_INACTIVE",
        voucherType: "seller_subscription",
        discountType: "percent",
        discountValue: 10,
        expiry: tomorrow,
        isActive: false,
        selectedPlans: ["pro", "premium"],
      },
      {
        voucherCode: "TEST_LIMIT",
        voucherType: "seller_subscription",
        discountType: "percent",
        discountValue: 10,
        expiry: tomorrow,
        isActive: true,
        usageLimit: 1,
        usedCount: 1,
        selectedPlans: ["pro", "premium"],
      },
      {
        voucherCode: "TEST_CUSTOMER",
        voucherType: "customer_all",
        discountType: "flat",
        discountValue: 100,
        expiry: tomorrow,
        isActive: true,
      }
    ]);

    console.log("Mock data created. Executing tests...\n");

    const runUpgrade = async (plan, voucherCode) => {
      // Reset user state to free before each test
      testSeller.sellerType = "free";
      testSeller.subscriptionPlan = "free";
      testSeller.subscriptionActive = false;
      testSeller.subscriptionValidUntil = null;
      await testSeller.save();
      await VoucherUsage.deleteMany({ userId: testSeller._id });

      let responseStatus = null;
      let responseJson = null;

      const mockReq = {
        user: testSeller,
        body: { plan, voucherCode }
      };

      const mockRes = {
        status: (code) => {
          responseStatus = code;
          return mockRes;
        },
        json: (data) => {
          responseJson = data;
          return mockRes;
        }
      };

      await upgradeSellerToPremiumManual(mockReq, mockRes);
      return { status: responseStatus || 200, data: responseJson };
    };

    let passCount = 0;
    let failCount = 0;

    const assertTest = (title, condition, info = "") => {
      if (condition) {
        console.log(`[PASS] ${title}`);
        passCount++;
      } else {
        console.log(`[FAIL] ${title} - ${info}`);
        failCount++;
      }
    };

    // 1. Test Valid Pro voucher
    {
      const res = await runUpgrade("pro", "TEST_PRO_50");
      assertTest(
        "Valid Pro voucher (50% discount on 10,767.50)",
        res.status === 200 &&
        res.data.subscriptionPlan === "pro" &&
        res.data.subscriptionActive === true,
        `Expected status 200, got ${res.status}. Data: ${JSON.stringify(res.data)}`
      );

      // Verify Voucher Usage Record
      const usage = await VoucherUsage.findOne({ userId: testSeller._id, voucherCode: "TEST_PRO_50" });
      assertTest(
        "VoucherUsage history saved for valid Pro voucher",
        usage !== null && usage.discountAmount === 5383.75 && usage.finalAmount === 5383.75,
        `Usage info: ${JSON.stringify(usage)}`
      );

      // Verify Voucher Used Count Incremented
      const voucher = await AdminVoucher.findOne({ voucherCode: "TEST_PRO_50" });
      assertTest(
        "Voucher usedCount incremented for valid Pro voucher",
        voucher.usedCount === 1,
        `usedCount: ${voucher?.usedCount}`
      );
    }

    // 2. Test Valid Premium voucher
    {
      const res = await runUpgrade("premium", "TEST_PREM_20000");
      assertTest(
        "Valid Premium voucher (flat 20,000 discount on 2,33,640.00)",
        res.status === 200 &&
        res.data.subscriptionPlan === "premium" &&
        res.data.subscriptionActive === true,
        `Expected status 200, got ${res.status}. Data: ${JSON.stringify(res.data)}`
      );

      // Verify Voucher Usage Record
      const usage = await VoucherUsage.findOne({ userId: testSeller._id, voucherCode: "TEST_PREM_20000" });
      assertTest(
        "VoucherUsage history saved for valid Premium voucher",
        usage !== null && usage.discountAmount === 20000 && usage.finalAmount === 213640,
        `Usage info: ${JSON.stringify(usage)}`
      );
    }

    // 3. Test Wrong plan voucher
    {
      const res = await runUpgrade("premium", "TEST_PRO_50");
      assertTest(
        "Wrong plan voucher (Pro voucher on Premium plan) rejected",
        res.status === 500 &&
        res.data.message.includes("Voucher is not applicable for the premium plan"),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // 4. Test Expired voucher
    {
      const res = await runUpgrade("pro", "TEST_EXPIRED");
      assertTest(
        "Expired voucher rejected",
        res.status === 500 &&
        res.data.message.includes("Voucher has expired"),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // 5. Test Inactive voucher
    {
      const res = await runUpgrade("pro", "TEST_INACTIVE");
      assertTest(
        "Inactive voucher rejected",
        res.status === 500 &&
        res.data.message.includes("Voucher is inactive"),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // 6. Test Invalid voucher code
    {
      const res = await runUpgrade("pro", "INVALID_CODE_123");
      assertTest(
        "Invalid voucher code rejected",
        res.status === 500 &&
        res.data.message.includes("Voucher does not exist"),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // 7. Test 100% discount voucher
    {
      const res = await runUpgrade("pro", "TEST_PRO_100");
      assertTest(
        "100% discount voucher upgrades seller directly",
        res.status === 200 &&
        res.data.subscriptionPlan === "pro" &&
        res.data.subscriptionActive === true,
        `Expected status 200, got ${res.status}. Data: ${JSON.stringify(res.data)}`
      );

      const usage = await VoucherUsage.findOne({ userId: testSeller._id, voucherCode: "TEST_PRO_100" });
      assertTest(
        "VoucherUsage history saved for 100% discount voucher (final amount is 0)",
        usage !== null && usage.finalAmount === 0,
        `Usage info: ${JSON.stringify(usage)}`
      );
    }

    // 8. Test Voucher already used beyond limit
    {
      const res = await runUpgrade("pro", "TEST_LIMIT");
      assertTest(
        "Voucher already used beyond limit rejected",
        res.status === 500 &&
        res.data.message.includes("Voucher usage limit reached"),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // 9. Test Wrong voucher type (Customer order voucher used on seller upgrade)
    {
      const res = await runUpgrade("pro", "TEST_CUSTOMER");
      assertTest(
        "Customer-only voucher on seller upgrade rejected",
        res.status === 500 &&
        res.data.message.includes("Wrong voucher type. This is not a seller upgrade voucher."),
        `Expected error, got status ${res.status}. Data: ${JSON.stringify(res.data)}`
      );
    }

    // Clean up test data after execution
    console.log("\nCleaning up test data...");
    await User.deleteMany({ email: testEmail });
    await AdminVoucher.deleteMany({ voucherCode: { $in: [
      "TEST_PRO_50", "TEST_PREM_20000", "TEST_EXPIRED", "TEST_INACTIVE", "TEST_LIMIT", "TEST_CUSTOMER", "TEST_PRO_100"
    ]}});
    await VoucherUsage.deleteMany({ voucherCode: { $in: [
      "TEST_PRO_50", "TEST_PREM_20000", "TEST_EXPIRED", "TEST_INACTIVE", "TEST_LIMIT", "TEST_CUSTOMER", "TEST_PRO_100"
    ]}});

    console.log(`\n--- TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED ---`);
    mongoose.disconnect();
    process.exit(failCount === 0 ? 0 : 1);
  } catch (error) {
    console.error("Test execution failed:", error);
    mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
