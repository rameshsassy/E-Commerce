import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import http from "http";
import { initSocket } from "./utils/socket.js";
import { startEmailSchedulers } from "./cron/scheduler.js";

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startEmailSchedulers().catch((e) => console.error("Email schedulers failed to start:", e));
});