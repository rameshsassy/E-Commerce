import { getClientDeviceType } from "../utils/clientDevice.js";

/**
 * Attaches req.clientDevice for responsive API defaults (pagination, payload caps).
 */
export function clientDeviceMiddleware(req, _res, next) {
  if (req.path.startsWith("/uploads") || req.path.startsWith("/api/uploads") || req.path === "/api/health") {
    return next();
  }
  const viewportHeader = req.headers["x-viewport-width"];
  req.clientDevice = getClientDeviceType({
    viewportWidth: viewportHeader,
    userAgent: req.headers["user-agent"],
  });
  next();
}
