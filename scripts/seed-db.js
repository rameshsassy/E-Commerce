import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import KycEntityType from "../models/KycEntityType.js";
import Category from "../models/Category.js";
import { DEFAULT_KYC_ENTITY_TYPES } from "../data/kycEntityTypesSeed.js";
import { SELLER_MAIN_CATEGORIES } from "../data/sellerMainCategories.js";

const MONGO_URI = process.env.MONGO_URI || "mongodb://34.58.81.112:27017/aashansh";

const seedDatabase = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    // 1. Seed KYC Entity Types
    console.log("Seeding KYC Entity Types...");
    let kycSeededCount = 0;
    for (const row of DEFAULT_KYC_ENTITY_TYPES) {
      await KycEntityType.updateOne(
        { code: row.code },
        {
          $setOnInsert: {
            code: row.code,
            label: row.label,
            sortOrder: row.sortOrder,
            requiresOtherText: Boolean(row.requiresOtherText),
            isSystem: true,
            isActive: true,
          },
        },
        { upsert: true }
      );
      kycSeededCount++;
    }
    console.log(`Successfully processed ${kycSeededCount} KYC Entity Types.`);

    // 2. Seed Default Admin User
    console.log("Checking for default admin user...");
    const adminEmail = "admin@aashansh.org";
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      console.log(`Creating default admin user (${adminEmail})...`);
      const hashedPassword = await bcrypt.hash("Admin@12345", 10);
      await User.create({
        firstName: "Admin",
        lastName: "System",
        email: adminEmail,
        mobile: "9999999999",
        password: hashedPassword,
        role: "admin",
        status: "approved",
      });
      console.log("Default admin user created successfully!");
      console.log(`Credentials -> Email: ${adminEmail} | Password: Admin@12345`);
    } else {
      console.log(`Default admin user (${adminEmail}) already exists.`);
    }

    // 3. Seed Default Categories in Category Collection
    console.log("Seeding Category collection...");
    let categorySeededCount = 0;
    for (const catName of SELLER_MAIN_CATEGORIES) {
      const slug = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const existingCat = await Category.findOne({ slug });
      if (!existingCat) {
        await Category.create({
          name: catName,
          slug,
          description: `All products related to ${catName}`,
          commissionRate: 5,
          isActive: true,
          isFeatured: false,
          parentCategory: null,
        });
        categorySeededCount++;
      }
    }
    console.log(`Seeded ${categorySeededCount} new category/categories.`);

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
