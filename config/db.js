import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI?.trim();

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
  } catch (error) {
    const msg = error?.message || String(error);
    console.error("Database connection failed:", msg);

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
