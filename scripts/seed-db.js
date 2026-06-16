import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import KycEntityType from "../models/KycEntityType.js";
import Category from "../models/Category.js";
import HeaderCategory from "../models/HeaderCategory.js";
import HomepageSetting from "../models/HomepageSetting.js";
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

    // 4. Seed Default Header Categories
    console.log("Seeding Header Categories...");
    const defaultHeaderCats = [
      { name: "Books & Stationery", slug: "books-stationery", displayOrder: 1 },
      { name: "Grocery & Gourmet", slug: "grocery-gourmet", displayOrder: 2 },
      { name: "Fashion", slug: "fashion", displayOrder: 3 },
      { name: "Beauty & Personal Care", slug: "beauty-personal-care", displayOrder: 4 },
      { name: "Health & Wellness", slug: "health-wellness", displayOrder: 5 },
      { name: "Electronics", slug: "electronics", displayOrder: 6 },
      { name: "Home & Kitchen", slug: "home-kitchen", displayOrder: 7 },
      { name: "Home Appliances", slug: "home-appliances", displayOrder: 8 },
    ];
    let headerCatsCount = 0;
    for (const item of defaultHeaderCats) {
      const existing = await HeaderCategory.findOne({ slug: item.slug });
      if (!existing) {
        await HeaderCategory.create(item);
        headerCatsCount++;
      }
    }
    console.log(`Seeded ${headerCatsCount} header categories.`);

    // 5. Seed/Update Homepage Settings
    console.log("Seeding Homepage Settings...");
    const correctSettings = {
      key: "header_settings",
      logo: {
        url: "/brand/aashansh-logo.png",
        enabled: true,
      },
      announcementBar: {
        enabled: true,
        scrolling: true,
        text: "conscious, inclusive, and impactful consumption",
        backgroundColor: "#ffd401",
        textColor: "#000000",
      },
      heroBanner: {
        enabled: true,
        image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80",
        headlineEnabled: true,
        headline: "Authentic. Ethical. Empowering.",
        headlineAlignment: "center",
        subtitleEnabled: true,
        subtitle: "Crafted with Purpose, Delivered with Heart ❤️",
        ctaEnabled: true,
        ctaText: "SHOP NOW",
        ctaLink: "/products",
        ctaColor: "#ffd401",
      },
    };
    await HomepageSetting.updateOne(
      { key: "header_settings" },
      { $set: correctSettings },
      { upsert: true }
    );
    console.log("Seeded/updated default homepage settings.");

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Database seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
