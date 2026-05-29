/**
 * Customer vs seller portal host detection (aashansh.org vs seller.aashansh.org).
 */

function parseOriginList(value) {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function hostnameFromOrigin(origin) {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function collectSellerHostnames() {
  const hosts = new Set();
  for (const origin of parseOriginList(process.env.SELLER_FRONTEND_URL)) {
    const h = hostnameFromOrigin(origin);
    if (h) hosts.add(h);
  }
  const extra = process.env.SELLER_PORTAL_HOSTS || "seller.aashansh.org,seller.localhost";
  for (const part of extra.split(",")) {
    const h = part.trim().toLowerCase();
    if (h) hosts.add(h);
  }
  return hosts;
}

function collectCustomerHostnames() {
  const hosts = new Set(["localhost", "127.0.0.1"]);
  for (const origin of parseOriginList(process.env.FRONTEND_URL)) {
    const h = hostnameFromOrigin(origin);
    if (h && !h.startsWith("seller.")) hosts.add(h);
  }
  const main = (process.env.CUSTOMER_PORTAL_HOST || "aashansh.org").toLowerCase();
  if (main) hosts.add(main);
  if (main && !main.startsWith("www.")) hosts.add(`www.${main}`);
  return hosts;
}

const SELLER_HOSTS = collectSellerHostnames();
const CUSTOMER_HOSTS = collectCustomerHostnames();

export function isSellerHostname(hostname) {
  if (!hostname) return false;
  const h = String(hostname).toLowerCase();
  if (SELLER_HOSTS.has(h)) return true;
  return h === "seller.localhost" || h.startsWith("seller.");
}

export function isCustomerHostname(hostname) {
  if (!hostname) return false;
  const h = String(hostname).toLowerCase();
  if (isSellerHostname(h)) return false;
  if (CUSTOMER_HOSTS.has(h)) return true;
  return h === "localhost" || h === "127.0.0.1";
}

/**
 * @returns {'seller'|'customer'|null}
 */
export function getPortalFromRequest(req) {
  const explicit =
    req.headers["x-portal"] ||
    req.body?.portal ||
    req.query?.portal;
  if (explicit === "seller" || explicit === "customer") {
    return explicit;
  }

  const origin = req.headers.origin || req.headers.referer || "";
  if (origin) {
    try {
      const host = new URL(origin).hostname;
      if (isSellerHostname(host)) return "seller";
      if (isCustomerHostname(host)) return "customer";
    } catch {
      /* ignore */
    }
  }

  const hostHeader = String(req.headers.host || "").split(":")[0];
  if (isSellerHostname(hostHeader)) return "seller";
  if (isCustomerHostname(hostHeader)) return "customer";

  return "customer";
}

export function getSellerPortalOrigin() {
  const list = parseOriginList(process.env.SELLER_FRONTEND_URL);
  if (list[0]) return list[0];
  return "https://seller.aashansh.org";
}

export function getCustomerPortalOrigin() {
  const list = parseOriginList(process.env.FRONTEND_URL);
  if (list[0]) return list[0];
  return "https://aashansh.org";
}

export function portalMismatchResponse(res, expectedPortal, userRole) {
  const redirectUrl =
    expectedPortal === "seller"
      ? `${getSellerPortalOrigin()}/login`
      : `${getCustomerPortalOrigin()}/login`;

  return res.status(403).json({
    message:
      expectedPortal === "seller"
        ? "Seller accounts must sign in at seller.aashansh.org."
        : "Customer accounts must sign in at aashansh.org.",
    code: "WRONG_PORTAL",
    expectedPortal,
    userRole,
    redirectUrl,
  });
}

export function assertPortalForRole(role, portal) {
  const sellerRoles = new Set(["seller"]);
  const customerRoles = new Set(["customer"]);
  const staffRoles = new Set(["admin", "admin_staff"]);

  if (portal === "seller") {
    if (customerRoles.has(role)) {
      const err = new Error("Customer accounts must use aashansh.org.");
      err.statusCode = 403;
      err.code = "WRONG_PORTAL";
      err.expectedPortal = "customer";
      err.redirectUrl = `${getCustomerPortalOrigin()}/login`;
      throw err;
    }
    if (staffRoles.has(role)) {
      const err = new Error("Admin accounts must sign in at aashansh.org.");
      err.statusCode = 403;
      err.code = "WRONG_PORTAL";
      err.expectedPortal = "customer";
      err.redirectUrl = `${getCustomerPortalOrigin()}/login`;
      throw err;
    }
    return;
  }

  // customer portal
  if (sellerRoles.has(role)) {
    const err = new Error("Seller accounts must sign in at seller.aashansh.org.");
    err.statusCode = 403;
    err.code = "WRONG_PORTAL";
    err.expectedPortal = "seller";
    err.redirectUrl = `${getSellerPortalOrigin()}/login`;
    throw err;
  }
}

export function assertPortalAllowsRegistration(portal, role) {
  if (portal === "seller" && role !== "seller") {
    const err = new Error("Registration is only available for sellers on this site.");
    err.statusCode = 403;
    throw err;
  }
  if (portal === "customer" && role !== "customer") {
    const err = new Error("Seller registration is at seller.aashansh.org.");
    err.statusCode = 403;
    err.expectedPortal = "seller";
    err.redirectUrl = `${getSellerPortalOrigin()}/register`;
    throw err;
  }
}
