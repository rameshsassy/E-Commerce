import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import SellerStore from "../models/SellerStore.js";
import { generateUniqueStoreSlug, getSubdomainFromRequest } from "../utils/storeDomain.js";

async function run() {
  console.log("Connecting to MongoDB...");
  await connectDB();

  console.log("\n--- Testing getSubdomainFromRequest ---");
  const tests = [
    { headers: { host: "raymond-fashion-store.aashansh.org" } },
    { headers: { host: "test-store.localhost" } },
    { headers: { host: "www.aashansh.org", origin: "https://my-store.aashansh.org" } },
    { headers: { host: "api.aashansh.org", referer: "https://best-store.aashansh.org/products" } },
    { headers: { host: "localhost:5000", origin: "http://test.localhost:5173" } },
  ];

  for (const req of tests) {
    const extracted = getSubdomainFromRequest(req);
    console.log(`Request [host: ${req.headers.host}, origin: ${req.headers.origin}, referer: ${req.headers.referer}]`);
    console.log(`=> Extracted Subdomain: ${extracted}`);
  }

  console.log("\n--- Testing generateUniqueStoreSlug ---");
  // Clean up any test stores first to have a clean slate
  await SellerStore.deleteMany({ storeSlug: /^test-store/ });

  // Generate slug first time
  const slug1 = await generateUniqueStoreSlug("Test Store");
  console.log(`Unique slug 1 (should be test-store): ${slug1}`);

  // Create store with slug1
  await SellerStore.create({
    sellerId: new mongoose.Types.ObjectId(),
    storeName: "Test Store",
    storeSlug: slug1,
    storeUrl: `https://${slug1}.aashansh.org`,
    domainType: "platform_subdomain",
  });

  // Generate slug second time
  const slug2 = await generateUniqueStoreSlug("Test Store");
  console.log(`Unique slug 2 (should be test-store-1): ${slug2}`);

  // Clean up test store
  await SellerStore.deleteMany({ storeSlug: /^test-store/ });
  console.log("Cleanup finished.");

  await mongoose.connection.close();
  console.log("Database connection closed.");
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
