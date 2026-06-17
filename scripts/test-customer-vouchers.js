import "dotenv/config";
import mongoose from "mongoose";
import crypto from "crypto";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Address from "../models/Address.js";
import Voucher from "../models/Voucher.js";
import AdminVoucher from "../models/AdminVoucher.js";
import VoucherUsage from "../models/VoucherUsage.js";
import Order from "../models/Order.js";
import Seller from "../models/Seller.js";
import Customer from "../models/Customer.js";
import Shipment from "../models/Shipment.js";
import Notification from "../models/Notification.js";
import Coupon from "../models/Coupon.js";
import { validateCustomerVoucher } from "../controllers/voucherUsage.controller.js";
import { createOrder, createRazorpayOrder, verifyRazorpayPayment } from "../controllers/order.controller.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

const runTests = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!\n");

    // Clean up old test data
    console.log("Cleaning up old test data...");
    const testEmails = [
      "test-customer-checkout@aashansh.org",
      "test-seller-checkout-a@aashansh.org",
      "test-seller-checkout-b@aashansh.org"
    ];
    await User.deleteMany({ email: { $in: testEmails } });
    await Seller.deleteMany({ email: { $in: testEmails } });
    await Customer.deleteMany({ email: { $in: testEmails } });
    await Address.deleteMany({ fullName: "Test Customer Address" });

    const voucherCodes = [
      "TEST_ADMIN_CUST_10",
      "TEST_ADMIN_SPEC_20",
      "TEST_ADMIN_SELL_A",
      "TEST_SELLER_A_ALL",
      "TEST_SELLER_A_PROD",
      "TEST_SELLER_A_CAT",
      "TEST_EXPIRED",
      "TEST_INACTIVE",
      "TEST_LIMIT",
      "TEST_100_PERCENT",
      "TEST_ADMIN_SUB_CHECKOUT"
    ];
    await Voucher.deleteMany({ voucherCode: { $in: voucherCodes } });
    await AdminVoucher.deleteMany({ voucherCode: { $in: voucherCodes } });
    await VoucherUsage.deleteMany({ voucherCode: { $in: voucherCodes } });

    // 1. Create Test Users
    console.log("Seeding test users...");
    const customer = await User.create({
      firstName: "Test",
      lastName: "Customer",
      email: "test-customer-checkout@aashansh.org",
      mobile: "9999911111",
      password: "dummyhashedpassword",
      role: "customer",
      status: "approved"
    });

    // Also create a Customer collection entry (Cart refs "Customer")
    await Customer.create({
      _id: customer._id,
      customerId: `CUST_${customer._id}`,
      firstName: "Test",
      lastName: "Customer",
      email: "test-customer-checkout@aashansh.org",
      mobile: "9999911111",
      password: "dummyhashedpassword",
      role: "customer",
      status: "approved"
    });

    const sellerAUser = await User.create({
      firstName: "Test",
      lastName: "Seller A",
      email: "test-seller-checkout-a@aashansh.org",
      mobile: "9999922222",
      password: "dummyhashedpassword",
      role: "seller",
      status: "approved",
      deliverablePincodes: ["110001", "400001"]
    });

    // Create Seller collection entry with matching _id (Product refs "Seller")
    const sellerA = await Seller.create({
      _id: sellerAUser._id,
      sellerId: `SEL_A_${sellerAUser._id}`,
      firstName: "Test",
      lastName: "Seller A",
      email: "test-seller-checkout-a@aashansh.org",
      mobile: "9999922222",
      password: "dummyhashedpassword",
      role: "seller",
      status: "approved",
      isHyperlocal: false,
      deliverablePincodes: ["110001", "400001"]
    });

    const sellerBUser = await User.create({
      firstName: "Test",
      lastName: "Seller B",
      email: "test-seller-checkout-b@aashansh.org",
      mobile: "9999933333",
      password: "dummyhashedpassword",
      role: "seller",
      status: "approved",
      deliverablePincodes: ["110001"]
    });

    const sellerB = await Seller.create({
      _id: sellerBUser._id,
      sellerId: `SEL_B_${sellerBUser._id}`,
      firstName: "Test",
      lastName: "Seller B",
      email: "test-seller-checkout-b@aashansh.org",
      mobile: "9999933333",
      password: "dummyhashedpassword",
      role: "seller",
      status: "approved",
      isHyperlocal: false,
      deliverablePincodes: ["110001"]
    });

    // Create shipping address for customer
    const address = await Address.create({
      user: customer._id,
      fullName: "Test Customer Address",
      phone: "9999911111",
      addressLine1: "123 Test Street",
      city: "New Delhi",
      state: "Delhi",
      pinCode: "110001",
      isDefault: true
    });

    // 2. Create Test Products
    console.log("Seeding test products...");
    const productA1 = await Product.create({
      sellerId: sellerA._id,
      title: "Test Product A1 (Books)",
      description: "Description of Product A1",
      category: "Books",
      price: 500,
      stock: 20,
      approvalStatus: "approved"
    });

    const productA2 = await Product.create({
      sellerId: sellerA._id,
      title: "Test Product A2 (Fashion)",
      description: "Description of Product A2",
      category: "Fashion",
      price: 1000,
      stock: 15,
      approvalStatus: "approved"
    });

    const productB1 = await Product.create({
      sellerId: sellerB._id,
      title: "Test Product B1 (Books)",
      description: "Description of Product B1",
      category: "Books",
      price: 300,
      stock: 30,
      approvalStatus: "approved"
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 3. Create Test Vouchers
    console.log("Seeding test vouchers...");
    
    // Admin customer global voucher
    await AdminVoucher.create({
      voucherCode: "TEST_ADMIN_CUST_10",
      voucherType: "customer_order", // mapping to new type
      discountType: "percent",
      discountValue: 10,
      expiry: tomorrow,
      isActive: true
    });

    // Admin customer specific product voucher
    await AdminVoucher.create({
      voucherCode: "TEST_ADMIN_SPEC_20",
      voucherType: "customer_specific",
      discountType: "percent",
      discountValue: 20,
      expiry: tomorrow,
      selectedProducts: [productA1._id],
      isActive: true
    });

    // Admin seller specific voucher
    await AdminVoucher.create({
      voucherCode: "TEST_ADMIN_SELL_A",
      voucherType: "seller_product", // mapping to new type
      discountType: "flat",
      discountValue: 100,
      expiry: tomorrow,
      selectedSellers: [sellerA._id],
      isActive: true
    });

    // Seller subscription voucher (which should fail customer checkout)
    await AdminVoucher.create({
      voucherCode: "TEST_ADMIN_SUB_CHECKOUT",
      voucherType: "seller_subscription",
      discountType: "percent",
      discountValue: 50,
      expiry: tomorrow,
      isActive: true,
      selectedPlans: ["pro"]
    });

    // Seller A global voucher (applies to all products of Seller A)
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_SELLER_A_ALL",
      scope: "all",
      discountType: "percent",
      discountValue: 10,
      expiry: tomorrow,
      isActive: true
    });

    // Seller A product-specific voucher (Product A1)
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_SELLER_A_PROD",
      scope: "specific",
      productId: productA1._id,
      discountType: "flat",
      discountValue: 150,
      expiry: tomorrow,
      isActive: true
    });

    // Seller A category-specific voucher (Category Fashion)
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_SELLER_A_CAT",
      scope: "all",
      category: "Fashion",
      discountType: "flat",
      discountValue: 200,
      expiry: tomorrow,
      isActive: true
    });

    // Expired Voucher
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_EXPIRED",
      scope: "all",
      discountType: "percent",
      discountValue: 10,
      expiry: yesterday,
      isActive: true
    });

    // Inactive Voucher
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_INACTIVE",
      scope: "all",
      discountType: "percent",
      discountValue: 10,
      expiry: tomorrow,
      isActive: false
    });

    // Usage Limited Voucher
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_LIMIT",
      scope: "all",
      discountType: "percent",
      discountValue: 10,
      expiry: tomorrow,
      usageLimit: 1,
      usedCount: 1,
      isActive: true
    });

    // 100% Discount Voucher
    await Voucher.create({
      sellerId: sellerA._id,
      voucherCode: "TEST_100_PERCENT",
      scope: "all",
      discountType: "percent",
      discountValue: 100,
      expiry: tomorrow,
      isActive: true
    });

    console.log("Seed data created successfully. Launching tests...\n");

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

    // Helper to setup cart for customer
    const setCartItems = async (itemsList) => {
      await Cart.deleteMany({ user: customer._id });
      const items = itemsList.map(item => ({
        product: item.product._id,
        quantity: item.quantity
      }));
      await Cart.create({ user: customer._id, items });
    };

    // Helper to validate voucher endpoint
    const runValidate = async (voucherCode) => {
      let responseStatus = null;
      let responseJson = null;

      const mockReq = {
        user: customer,
        body: { voucherCode }
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

      await validateCustomerVoucher(mockReq, mockRes);
      return { status: responseStatus || 200, data: responseJson };
    };

    // Test Case 1: Admin customer voucher on single seller cart
    {
      await setCartItems([{ product: productA1, quantity: 1 }]); // subtotal = 500
      const res = await runValidate("TEST_ADMIN_CUST_10");
      assertTest(
        "Admin customer voucher on single seller cart",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 50 &&
        res.data.finalAmount === 450,
        `Expected status 200, discount 50, final 450. Got status: ${res.status}, data: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 2: Admin customer voucher on multi-seller cart
    {
      await setCartItems([
        { product: productA1, quantity: 1 }, // seller A, 500
        { product: productB1, quantity: 1 }  // seller B, 300
      ]); // subtotal = 800
      const res = await runValidate("TEST_ADMIN_CUST_10");
      assertTest(
        "Admin customer voucher on multi-seller cart",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 80 &&
        res.data.finalAmount === 720,
        `Expected discount 80, final 720. Got status: ${res.status}, data: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 3: Seller product voucher on same seller products
    {
      await setCartItems([{ product: productA1, quantity: 2 }]); // subtotal = 1000, seller A
      const res = await runValidate("TEST_SELLER_A_ALL");
      assertTest(
        "Seller product voucher on same seller products",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 100 &&
        res.data.finalAmount === 900,
        `Expected discount 100, final 900. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 4: Seller product voucher on different seller product should fail
    {
      await setCartItems([{ product: productB1, quantity: 1 }]); // subtotal = 300, seller B
      const res = await runValidate("TEST_SELLER_A_ALL"); // Seller A voucher
      assertTest(
        "Seller product voucher on different seller product fails",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("Wrong seller or product voucher"),
        `Expected failure status 400. Got status: ${res.status}, data: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 5: Seller product voucher on mixed seller cart applies only eligible seller items
    {
      await setCartItems([
        { product: productA1, quantity: 1 }, // seller A, 500
        { product: productB1, quantity: 1 }  // seller B, 300
      ]); // subtotal = 800
      const res = await runValidate("TEST_SELLER_A_ALL"); // 10% on seller A products only (10% of 500 = 50)
      assertTest(
        "Seller product voucher on mixed seller cart applies only to eligible items",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 50 &&
        res.data.finalAmount === 750,
        `Expected discount 50, final 750. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 6: Product-specific voucher applies only selected product
    {
      await setCartItems([
        { product: productA1, quantity: 1 }, // A1 matches, 500
        { product: productA2, quantity: 1 }  // A2 doesn't match, 1000
      ]); // subtotal = 1500
      const res = await runValidate("TEST_SELLER_A_PROD"); // flat 150 on Product A1
      assertTest(
        "Product-specific voucher applies only to selected product",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 150 &&
        res.data.finalAmount === 1350,
        `Expected discount 150, final 1350. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 7: Category-specific voucher applies only selected category
    {
      await setCartItems([
        { product: productA1, quantity: 1 }, // A1 is Books (500) -> not eligible
        { product: productA2, quantity: 1 }  // A2 is Fashion (1000) -> eligible
      ]); // subtotal = 1500
      const res = await runValidate("TEST_SELLER_A_CAT"); // flat 200 on Fashion category
      assertTest(
        "Category-specific voucher applies only to selected category",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 200 &&
        res.data.finalAmount === 1300,
        `Expected discount 200, final 1300. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 8: Expired voucher rejected
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_EXPIRED");
      assertTest(
        "Expired voucher rejected",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("expired"),
        `Expected expired error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 9: Inactive voucher rejected
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_INACTIVE");
      assertTest(
        "Inactive voucher rejected",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("inactive"),
        `Expected inactive error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 10: Invalid voucher rejected
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_INVALID_CODE_XYZ");
      assertTest(
        "Invalid voucher rejected",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("does not exist"),
        `Expected not exists error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 11: Usage limit exceeded rejected
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_LIMIT");
      assertTest(
        "Usage limit exceeded rejected",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("usage limit reached"),
        `Expected limit reached error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 12: Admin seller-subscription voucher rejected on checkout
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_ADMIN_SUB_CHECKOUT");
      assertTest(
        "Seller upgrade voucher rejected on customer checkout",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("only for seller plan upgrades"),
        `Expected upgrade voucher error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 13: 100% discount voucher final amount ₹0
    {
      await setCartItems([{ product: productA1, quantity: 1 }]); // price = 500
      const res = await runValidate("TEST_100_PERCENT");
      assertTest(
        "100% discount voucher makes final amount ₹0",
        res.status === 200 &&
        res.data.success === true &&
        res.data.discountAmount === 500 &&
        res.data.finalAmount === 0,
        `Expected discount 500, final amount 0. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Helper to simulate complete checkout/payment flow
    const runCheckoutFlow = async (voucherCode, paymentMethod) => {
      let responseStatus = null;
      let responseJson = null;

      const mockReq = {
        user: customer,
        body: {
          addressId: address._id,
          voucherCode,
          paymentMethod
        }
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

      if (paymentMethod === "COD") {
        await createOrder(mockReq, mockRes);
      } else {
        await createRazorpayOrder(mockReq, mockRes);
      }

      return { status: responseStatus || 201, data: responseJson };
    };

    // Test Case 14: COD checkout increments usedCount and saves VoucherUsage history
    {
      // Reset usedCount & usage history for TEST_SELLER_A_ALL
      await Voucher.updateOne({ voucherCode: "TEST_SELLER_A_ALL" }, { $set: { usedCount: 0 } });
      await VoucherUsage.deleteMany({ voucherCode: "TEST_SELLER_A_ALL" });

      await setCartItems([{ product: productA1, quantity: 2 }]); // total = 1000

      const checkoutRes = await runCheckoutFlow("TEST_SELLER_A_ALL", "COD");
      assertTest(
        "COD checkout successfully creates order with voucher",
        checkoutRes.status === 201 && checkoutRes.data._id !== undefined,
        `Expected order creation. Got status: ${checkoutRes.status}, data: ${JSON.stringify(checkoutRes.data)}`
      );

      // Verify usedCount incremented
      const updatedVoucher = await Voucher.findOne({ voucherCode: "TEST_SELLER_A_ALL" });
      assertTest(
        "usedCount increments after successful COD order placement",
        updatedVoucher.usedCount === 1,
        `Expected usedCount to be 1, got: ${updatedVoucher?.usedCount}`
      );

      // Verify VoucherUsage history saved
      const usageHistory = await VoucherUsage.findOne({
        userId: customer._id,
        voucherCode: "TEST_SELLER_A_ALL"
      });
      assertTest(
        "VoucherUsage history saved after successful COD order placement",
        usageHistory !== null &&
        usageHistory.discountAmount === 100 &&
        usageHistory.finalAmount === 900,
        `Expected usage history with 100 discount, got: ${JSON.stringify(usageHistory)}`
      );
    }

    // Test Case 15: Per-user usage limit validation check (trying to use same voucher again should fail)
    {
      await setCartItems([{ product: productA1, quantity: 1 }]);
      const res = await runValidate("TEST_SELLER_A_ALL");
      assertTest(
        "Voucher usage limit per user enforced correctly (second use rejected)",
        res.status === 400 &&
        res.data.success === false &&
        res.data.message.includes("usage limit per user exceeded"),
        `Expected per-user limit error. Got: ${JSON.stringify(res.data)}`
      );
    }

    // Test Case 16: Razorpay checkout increments usedCount and saves VoucherUsage history after verification
    {
      // Create another seller voucher to test Razorpay
      const rzpVoucherCode = "TEST_RZP_VOUCH";
      await Voucher.deleteMany({ voucherCode: rzpVoucherCode });
      await VoucherUsage.deleteMany({ voucherCode: rzpVoucherCode });
      
      await Voucher.create({
        sellerId: sellerA._id,
        voucherCode: rzpVoucherCode,
        scope: "all",
        discountType: "percent",
        discountValue: 15,
        expiry: tomorrow,
        isActive: true
      });

      await setCartItems([{ product: productA1, quantity: 2 }]); // total = 1000

      // Run createRazorpayOrder
      const rzpOrderRes = await runCheckoutFlow(rzpVoucherCode, "Razorpay");
      assertTest(
        "Razorpay checkout successfully creates pending order",
        rzpOrderRes.status === 200 && rzpOrderRes.data.orderId !== undefined,
        `Expected razorpay order info. Got status: ${rzpOrderRes.status}, data: ${JSON.stringify(rzpOrderRes.data)}`
      );

      const createdOrderId = rzpOrderRes.data.orderId;

      // Verify usedCount NOT incremented yet (since payment is pending)
      let voucherStatus = await Voucher.findOne({ voucherCode: rzpVoucherCode });
      assertTest(
        "usedCount does not increment before Razorpay payment is verified",
        voucherStatus.usedCount === 0,
        `Expected usedCount 0, got: ${voucherStatus?.usedCount}`
      );

      // Verify VoucherUsage history NOT saved yet
      let usageStatus = await VoucherUsage.findOne({ voucherCode: rzpVoucherCode });
      assertTest(
        "VoucherUsage history not saved before Razorpay payment is verified",
        usageStatus === null,
        `Expected no usage history, got: ${JSON.stringify(usageStatus)}`
      );

      // Mock verify payment signature
      const rOrderId = rzpOrderRes.data.id;
      const rPaymentId = `pay_mock_${Date.now()}`;
      
      // Calculate signature: sign = rOrderId + "|" + rPaymentId
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_secret_12345")
        .update(rOrderId + "|" + rPaymentId)
        .digest("hex");

      const mockReqVerify = {
        user: customer,
        body: {
          razorpay_order_id: rOrderId,
          razorpay_payment_id: rPaymentId,
          razorpay_signature: expectedSign,
          orderId: createdOrderId
        }
      };

      let verifyStatus = null;
      let verifyJson = null;

      const mockResVerify = {
        status: (code) => {
          verifyStatus = code;
          return mockResVerify;
        },
        json: (data) => {
          verifyJson = data;
          return mockResVerify;
        }
      };

      await verifyRazorpayPayment(mockReqVerify, mockResVerify);
      assertTest(
        "Razorpay payment verification finishes successfully",
        verifyStatus === null || verifyStatus === 200,
        `Expected verification success. Got status: ${verifyStatus}, data: ${JSON.stringify(verifyJson)}`
      );

      // Verify usedCount IS now incremented
      voucherStatus = await Voucher.findOne({ voucherCode: rzpVoucherCode });
      assertTest(
        "usedCount increments after successful payment verification",
        voucherStatus.usedCount === 1,
        `Expected usedCount 1, got: ${voucherStatus?.usedCount}`
      );

      // Verify VoucherUsage history IS now saved
      usageStatus = await VoucherUsage.findOne({
        userId: customer._id,
        voucherCode: rzpVoucherCode
      });
      assertTest(
        "VoucherUsage history saved after successful payment verification",
        usageStatus !== null &&
        usageStatus.discountAmount === 150 &&
        usageStatus.finalAmount === 850,
        `Expected usage history with 150 discount, got: ${JSON.stringify(usageStatus)}`
      );

      // Clean up the temporary Razorpay test voucher
      await Voucher.deleteMany({ voucherCode: rzpVoucherCode });
      await VoucherUsage.deleteMany({ voucherCode: rzpVoucherCode });
    }

    // Clean up test data after execution
    console.log("\nCleaning up test data...");
    await User.deleteMany({ email: { $in: testEmails } });
    await Seller.deleteMany({ email: { $in: testEmails } });
    await Customer.deleteMany({ email: { $in: testEmails } });
    await Address.deleteMany({ fullName: "Test Customer Address" });
    await Product.deleteMany({ _id: { $in: [productA1._id, productA2._id, productB1._id] } });
    await Cart.deleteMany({ user: customer._id });
    await Voucher.deleteMany({ voucherCode: { $in: voucherCodes } });
    await AdminVoucher.deleteMany({ voucherCode: { $in: voucherCodes } });
    await VoucherUsage.deleteMany({ voucherCode: { $in: voucherCodes } });
    await Order.deleteMany({ user: customer._id });
    await Shipment.deleteMany({});

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
