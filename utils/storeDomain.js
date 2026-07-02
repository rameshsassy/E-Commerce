const SUBDOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function getPlatformStoreHost() {
  const fromEnv = process.env.STORE_PLATFORM_HOST;
  if (fromEnv) return fromEnv.replace(/^https?:\/\//, "").replace(/\/$/, "");
  try {
    const url = new URL(
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    return url.hostname;
  } catch {
    return "aashansh.org";
  }
}

export function normalizeSubdomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeCustomDomain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/^www\./, "");
}

export function validateSubdomain(subdomain) {
  const s = normalizeSubdomain(subdomain);
  if (!s || s.length < 3) {
    return { ok: false, message: "Subdomain must be at least 3 characters." };
  }
  if (!SUBDOMAIN_RE.test(s)) {
    return {
      ok: false,
      message:
        "Subdomain can only use lowercase letters, numbers, and hyphens (not at start/end).",
    };
  }
  return { ok: true, value: s };
}

export function validateCustomDomain(domain) {
  const d = normalizeCustomDomain(domain);
  if (!d) {
    return { ok: false, message: "Custom domain is required." };
  }
  if (!DOMAIN_RE.test(d)) {
    return {
      ok: false,
      message: "Enter a valid domain (e.g. shop.yourbrand.com).",
    };
  }
  return { ok: true, value: d };
}

/**
 * Returns the customer frontend origin (no trailing slash).
 * Uses FRONTEND_URL env var, falls back to https://aashansh.org.
 */
export function getCustomerFrontendBase() {
  const raw = process.env.FRONTEND_URL;
  if (raw) {
    // FRONTEND_URL may contain comma-separated values; take the first one
    const first = raw.split(",")[0].trim();
    return first.replace(/\/+$/, "");
  }
  return "https://aashansh.org";
}

export function buildStorePublicUrl(store) {
  if (!store) return null;
  if (store.domainType === "own_domain" && store.customDomain) {
    return `https://${store.customDomain}`;
  }
  const slug = store.storeSlug || store.subdomain;
  if (slug) {
    const base = getCustomerFrontendBase();
    return `${base}/store/${slug}`;
  }
  return null;
}

export function getSubdomainPreview(subdomain) {
  const slug = normalizeSubdomain(subdomain) || "your-store";
  const base = getCustomerFrontendBase();
  return `${base}/store/${slug}`;
}

import mongoose from "mongoose";

/**
 * Extracts subdomain from host, X-Forwarded-Host, Origin, or Referer headers.
 * E.g., raymond-fashion-store.aashansh.org -> raymond-fashion-store
 */
export function getSubdomainFromRequest(req) {
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "";
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  const parseHost = (str) => {
    try {
      if (str.startsWith("http://") || str.startsWith("https://")) {
        return new URL(str).hostname;
      }
      return str.split(":")[0];
    } catch {
      return "";
    }
  };

  const hosts = [parseHost(hostHeader), parseHost(origin), parseHost(referer)].filter(Boolean);

  for (const host of hosts) {
    const domain = host.toLowerCase();

    if (
      domain === "localhost" ||
      domain === "127.0.0.1" ||
      domain === "::1" ||
      /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)
    ) {
      continue;
    }

    // Check for production domain
    if (domain.endsWith(".aashansh.org")) {
      const sub = domain.replace(".aashansh.org", "");
      if (sub && sub !== "www" && sub !== "api" && sub !== "admin" && sub !== "seller") {
        return sub;
      }
    }

    // Check for local development domain
    if (domain.endsWith(".localhost")) {
      const sub = domain.replace(".localhost", "");
      if (sub && sub !== "www" && sub !== "api" && sub !== "admin" && sub !== "seller") {
        return sub;
      }
    }

    // Fallback for general domains with subdomains
    const parts = domain.split(".");
    if (parts.length > 2) {
      const sub = parts[0];
      if (
        sub &&
        sub !== "www" &&
        sub !== "api" &&
        sub !== "admin" &&
        sub !== "seller" &&
        !sub.includes("localhost") &&
        !sub.includes("127.0.0.1")
      ) {
        return sub;
      }
    }
  }

  return null;
}

/**
 * Generates a unique store slug from store name. Appends a counter (e.g., -1, -2) if conflicts exist.
 */
export async function generateUniqueStoreSlug(storeName, currentStoreId = null) {
  const SellerStore = mongoose.model("SellerStore");
  const baseSlug = normalizeSubdomain(storeName) || "storename";
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { storeSlug: slug };
    if (currentStoreId) {
      query._id = { $ne: currentStoreId };
    }
    const existing = await SellerStore.findOne(query);
    if (!existing) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}
