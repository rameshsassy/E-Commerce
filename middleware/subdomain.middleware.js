import mongoose from "mongoose";
import { getSubdomainFromRequest } from "../utils/storeDomain.js";

/**
 * Middleware that detects if the request hostname/headers specify a seller subdomain,
 * fetches the corresponding active SellerStore, and attaches it to req.subdomainStore.
 */
export const subdomainStoreMiddleware = async (req, res, next) => {
  if (req.path.startsWith("/uploads") || req.path.startsWith("/api/uploads") || req.path === "/api/health") {
    return next();
  }
  try {
    const subdomain = getSubdomainFromRequest(req);
    if (subdomain) {
      const SellerStore = mongoose.model("SellerStore");
      const store = await SellerStore.findOne({ storeSlug: subdomain, isActive: true });
      if (store) {
        req.subdomainStore = store;
      } else {
        // Fallback for older stores where storeSlug wasn't set yet
        const oldStore = await SellerStore.findOne({ subdomain, isActive: true });
        if (oldStore) {
          req.subdomainStore = oldStore;
        }
      }
    }
  } catch (err) {
    console.error("Error in subdomainStoreMiddleware:", err);
  }
  next();
};
