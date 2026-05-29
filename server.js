import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import mongoose from "mongoose";
import { initSocket } from "./utils/socket.js";
import { startEmailSchedulers } from "./cron/scheduler.js";

const PORT = Number(process.env.PORT) || 5000;
const isProd = process.env.NODE_ENV === "production";
const LISTEN_RETRIES = isProd ? 1 : 15;

connectDB();

const server = http.createServer(app);
initSocket(server);

let shuttingDown = false;

function listenOnce() {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      cleanup();
      reject(err);
    };
    const onListening = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      server.off("error", onError);
      server.off("listening", onListening);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(PORT);
  });
}

async function startServer() {
  for (let attempt = 1; attempt <= LISTEN_RETRIES; attempt++) {
    try {
      await listenOnce();
      console.log(`Server running on port ${PORT}`);
      startEmailSchedulers().catch((e) =>
        console.error("Email schedulers failed to start:", e)
      );
      return;
    } catch (err) {
      if (err.code !== "EADDRINUSE" || attempt === LISTEN_RETRIES) {
        if (err.code === "EADDRINUSE") {
          console.error(
            `\nPort ${PORT} is still in use after ${LISTEN_RETRIES} attempts.`,
            `\nStop extra dev servers: pkill -f "nodemon server.js"`,
            `\nOr free the port: kill $(lsof -t -i:${PORT})`
          );
        } else {
          console.error("Server failed to start:", err.message);
        }
        process.exit(1);
      }
      const waitMs = Math.min(200 * attempt, 2000);
      if (attempt <= 3) {
        console.warn(
          `[server] Port ${PORT} busy (nodemon restart?), retrying in ${waitMs}ms (${attempt}/${LISTEN_RETRIES})…`
        );
      }
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (signal && process.env.NODE_ENV !== "production") {
    console.log(`[server] ${signal} — closing HTTP server…`);
  }

  await new Promise((resolve) => {
    server.close(() => resolve());
    setTimeout(resolve, 2500).unref?.();
  });

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close(false);
    }
  } catch {
    /* ignore */
  }

  process.exit(0);
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  shutdown("SIGINT");
});

startServer();
