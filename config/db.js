import mongoose from "mongoose";
import { ensureKycEntityTypesSeeded } from "../utils/kycEntityTypes.js";

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();
  const fallbackUri =
    process.env.MONGO_FALLBACK_URI?.trim() ||
    "mongodb://127.0.0.1:27017/aashansh";

  if (!uri) {
    console.error(
      "Database connection failed: MONGO_URI is missing. Set it in .env (see .env.example)."
    );
    process.exit(1);
  }

  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error(
      "Database connection failed: MONGO_URI must start with mongodb:// or mongodb+srv://"
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await ensureKycEntityTypesSeeded();
  } catch (error) {
    const msg = error?.message || String(error);
    console.error("Database connection failed:", msg);

    // If Atlas DNS/connection fails, attempt local fallback (helps dev stay unblocked).
    const isSrvResolutionFailure =
      msg.includes("querySrv") ||
      msg.includes("ENOTFOUND") ||
      msg.includes("ECONNREFUSED") ||
      msg.includes("EAI_AGAIN");

    if (isSrvResolutionFailure) {
      try {
        console.warn(
          `[db] Atlas connection failed, trying fallback MongoDB: ${fallbackUri}`
        );
        const conn = await mongoose.connect(fallbackUri);
        console.log(`MongoDB Connected (fallback): ${conn.connection.host}`);
        await ensureKycEntityTypesSeeded();
        return;
      } catch (fallbackErr) {
        console.error(
          "[db] Fallback MongoDB connection also failed:",
          fallbackErr?.message || String(fallbackErr)
        );
      }
    }

    if (msg.includes("querySrv") || msg.includes("ENOTFOUND")) {
      console.error(
        "Hint: For mongodb+srv://, the hostname after @ must be your full Atlas host " +
          "(e.g. cluster0.abcd123.mongodb.net), not a placeholder or truncated value. " +
          "Copy the connection string from Atlas → Database → Connect → Drivers."
      );
      console.error(
        "Hint: For local MongoDB use: mongodb://127.0.0.1:27017/your_db_name"
      );
    }

    process.exit(1);
  }
};

export default connectDB;
