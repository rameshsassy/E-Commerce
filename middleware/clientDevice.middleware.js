import { getClientDeviceType } from "../utils/clientDevice.js";

/**
 * Attaches req.clientDevice for responsive API defaults (pagination, payload caps).
 */
export function clientDeviceMiddleware(req, _res, next) {
  const viewportHeader = req.headers["x-viewport-width"];
  req.clientDevice = getClientDeviceType({
    viewportWidth: viewportHeader,
    userAgent: req.headers["user-agent"],
  });
  next();
}
