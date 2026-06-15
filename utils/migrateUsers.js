import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Seller from "../models/Seller.js";
import Counter from "../models/Counter.js";
import { generateCustomerId, generateSellerId } from "./idGenerator.js";

export const runMigration = async () => {
  console.log("[migration] Checking if user migration is needed...");

  try {
    // 1. Migrate Customers
    const customerUsers = await User.find({ role: "customer" });
    if (customerUsers.length > 0) {
      console.log(`[migration] Found ${customerUsers.length} customers to migrate.`);
      for (const u of customerUsers) {
        try {
          let customerId = u.customerId;
          if (!customerId) {
            customerId = await generateCustomerId();
          }

          // Check if a customer with this ID or _id already exists
          const exists = await Customer.findOne({ $or: [{ _id: u._id }, { customerId }] });
          if (!exists) {
            const customerData = { ...u.toObject(), customerId };
            // delete role if we want, but keeping it makes other role checks safe
            await Customer.create(customerData);
            console.log(`[migration] Migrated customer: ${u.email} -> ${customerId}`);
          }
          await User.deleteOne({ _id: u._id });
        } catch (err) {
          console.error(`[migration] Failed to migrate customer ${u.email}:`, err.message);
        }
      }
    }

    // 2. Migrate Sellers
    const sellerUsers = await User.find({ role: "seller" });
    if (sellerUsers.length > 0) {
      console.log(`[migration] Found ${sellerUsers.length} sellers to migrate.`);
      for (const u of sellerUsers) {
        try {
          let sellerId = u.sellerId;
          if (!sellerId) {
            sellerId = await generateSellerId();
          }

          // Check if a seller with this ID or _id already exists
          const exists = await Seller.findOne({ $or: [{ _id: u._id }, { sellerId }] });
          if (!exists) {
            const sellerData = { ...u.toObject(), sellerId };
            await Seller.create(sellerData);
            console.log(`[migration] Migrated seller: ${u.email} -> ${sellerId}`);
          }
          await User.deleteOne({ _id: u._id });
        } catch (err) {
          console.error(`[migration] Failed to migrate seller ${u.email}:`, err.message);
        }
      }
    }

    // 3. Align Counter sequences to match the maximum ID in the database
    await alignCounters();
  } catch (error) {
    console.error("[migration] Error during user migration:", error.message);
  }

  console.log("[migration] Migration check complete.");
};

export const alignCounters = async () => {
  try {
    // Align customerCounter
    const customers = await Customer.find({ customerId: { $exists: true } });
    let maxCustomerVal = 1000;
    for (const c of customers) {
      const match = c.customerId.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxCustomerVal) maxCustomerVal = val;
      }
    }

    const customerCounter = await Counter.findOne({ name: "customerCounter" });
    if (!customerCounter || customerCounter.sequenceValue < maxCustomerVal) {
      await Counter.findOneAndUpdate(
        { name: "customerCounter" },
        { $set: { sequenceValue: maxCustomerVal } },
        { upsert: true }
      );
      console.log(`[migration] Aligned customerCounter to ${maxCustomerVal}`);
    }

    // Align sellerCounter
    const sellers = await Seller.find({ sellerId: { $exists: true } });
    let maxSellerVal = 1000;
    for (const s of sellers) {
      const match = s.sellerId.match(/\d+/);
      if (match) {
        const val = parseInt(match[0], 10);
        if (val > maxSellerVal) maxSellerVal = val;
      }
    }

    const sellerCounter = await Counter.findOne({ name: "sellerCounter" });
    if (!sellerCounter || sellerCounter.sequenceValue < maxSellerVal) {
      await Counter.findOneAndUpdate(
        { name: "sellerCounter" },
        { $set: { sequenceValue: maxSellerVal } },
        { upsert: true }
      );
      console.log(`[migration] Aligned sellerCounter to ${maxSellerVal}`);
    }
  } catch (err) {
    console.error("[migration] Error aligning counters:", err.message);
  }
};
