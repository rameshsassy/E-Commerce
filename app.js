import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ NEW

import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// ===============================
// ✅ MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// 📁 STATIC FILES (images, KYC docs)
// ===============================
app.use("/uploads", express.static("uploads"));

// ===============================
// ✅ ROUTES
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/user", userRoutes); // ✅ NEW (COMMON PROFILE)

// ===============================
// 🏠 ROOT ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ===============================
// ❌ 404 HANDLER
// ===============================
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// ===============================
// ⚠️ GLOBAL ERROR HANDLER
// ===============================
app.use(errorHandler);

export default app;