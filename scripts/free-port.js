/**
 * Dev-only: release PORT before nodemon starts (kills stale node server.js).
 */
import { execSync } from "node:child_process";

const port = Number(process.env.PORT) || 5000;

function listPidsOnPort() {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    return out ? out.split(/\s+/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function processArgs(pid) {
  try {
    return execSync(`ps -p ${pid} -o args=`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function isNodeProcess(pid) {
  try {
    const comm = execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" }).trim();
    if (comm === "node" || comm.endsWith("/node")) return true;
    return /\bnode(\s|$)/.test(processArgs(pid));
  } catch {
    return false;
  }
}

function isServerJsProcess(pid) {
  return processArgs(pid).includes("server.js");
}

function processLabel(pid) {
  try {
    return execSync(`ps -p ${pid} -o comm=`, { encoding: "utf8" }).trim() || "unknown";
  } catch {
    return "unknown";
  }
}

const pids = listPidsOnPort();
if (!pids.length) {
  process.exit(0);
}

for (const pid of pids) {
  if (!isNodeProcess(pid)) {
    console.error(
      `[dev] Port ${port} is in use by "${processLabel(pid)}" (pid ${pid}), not Node.`,
      `\n[dev] On macOS, disable AirPlay Receiver if it uses port 5000, or set PORT=5001 in .env.`
    );
    process.exit(1);
  }
  if (!isServerJsProcess(pid)) {
    console.error(
      `[dev] Port ${port} is held by Node (pid ${pid}) but not server.js:`,
      processArgs(pid).slice(0, 80),
      `\n[dev] Stop it manually or set PORT in .env.`
    );
    process.exit(1);
  }
  console.log(`[dev] Stopping stale server on port ${port} (pid ${pid})`);
  try {
    process.kill(Number(pid), "SIGTERM");
  } catch (err) {
    if (err.code !== "ESRCH") throw err;
  }
}

await new Promise((r) => setTimeout(r, 600));
