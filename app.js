import express from "express";
import dotenv from "dotenv";
import cors from "cors";
// import helmet from "helmet";
// import rateLimit from "express-rate-limit";
// import xss from "xss-clean";

import authRoutes from "./routes/auth.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import productRoutes from "./routes/product.routes.js";
import userRoutes from "./routes/user.routes.js"; // ✅ NEW
import shipmentRoutes from "./routes/shipment.routes.js";
import returnRoutes from "./routes/return.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import supportRoutes from "./routes/support.routes.js";
import categoryRoutes from "./routes/category.routes.js";

import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();

const app = express();

// Request Logger
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ===============================
// ✅ MIDDLEWARE
// ===============================
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Manual Cookie Parser Middleware
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const value = parts.slice(1).join('=');
        try {
          req.cookies[name] = decodeURIComponent(value);
        } catch (e) {
          req.cookies[name] = value; // Fallback to raw value if decode fails
        }
      }
    });
  }
  next();
});

// ===============================
// 🛡️ SECURITY HARDENING (Priority 9)
// ===============================
// Note: Uncomment these after running `npm install helmet express-rate-limit xss-clean`
// app.use(helmet()); // Set security HTTP headers
// app.use(xss()); // Prevent XSS attacks
// 
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
//   message: "Too many requests from this IP, please try again after 15 minutes"
// });
// app.use('/api/', limiter); // Apply rate limiting to all API routes

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
app.use("/api/shipments", shipmentRoutes);
app.use("/api/returns", returnRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/categories", categoryRoutes);

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