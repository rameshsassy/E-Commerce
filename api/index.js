import "dotenv/config";
import serverless from "serverless-http";
import app from "../app.js";
import connectDB from "../config/db.js";

let dbReady = false;
let handler;

async function ensureDb() {
  if (dbReady) return;
  await connectDB();
  dbReady = true;
}

export default async function vercelHandler(req, res) {
  try {
    await ensureDb();
    if (!handler) handler = serverless(app);
    return handler(req, res);
  } catch (err) {
    console.error("[api] handler error:", err?.message || err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ message: err?.message || "Server error" }));
  }
}
