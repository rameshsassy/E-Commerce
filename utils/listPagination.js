import { capListLimit, getDefaultListLimit } from "./clientDevice.js";

/**
 * Resolve page/limit for list endpoints with mobile-friendly defaults.
 */
export function resolveListPagination(req, query = {}, options = {}) {
  const deviceType = req.clientDevice || "desktop";
  const page = Math.max(1, Number(query.page) || 1);
  const hasExplicitLimit = query.limit !== undefined && query.limit !== "";

  const limit = hasExplicitLimit
    ? capListLimit(deviceType, query.limit, options.cap)
    : getDefaultListLimit(deviceType, options.defaults);

  return { page, limit, skip: (page - 1) * limit, deviceType };
}
