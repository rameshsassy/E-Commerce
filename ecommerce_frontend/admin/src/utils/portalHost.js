/**
 * Customer portal: localhost:5174 (prod: aashansh.org later)
 * Seller portal: seller.localhost:5175 or /seller/* on localhost (prod: seller.aashansh.org later)
 */

const DEFAULT_SELLER_HOSTS = 'seller.localhost';
const DEFAULT_CUSTOMER_ORIGIN = 'http://localhost:5174';
const DEFAULT_SELLER_ORIGIN = 'http://seller.localhost:5175';

function isLocalHostname(hostname) {
  const h = String(hostname).toLowerCase();
  return h === 'localhost' || h === '127.0.0.1';
}

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function sellerHostnames() {
  return parseList(import.meta.env.VITE_SELLER_PORTAL_HOSTS || DEFAULT_SELLER_HOSTS);
}

export function isSellerPortal(
  hostname = window.location.hostname,
  pathname = window.location.pathname
) {
  const force = import.meta.env.VITE_PORTAL;
  if (force === 'seller') return true;
  if (force === 'customer') return false;

  if (typeof window !== 'undefined') {
    const q = new URLSearchParams(window.location.search).get('portal');
    if (q === 'seller') return true;
    if (q === 'customer') return false;
  }

  const h = String(hostname).toLowerCase();
  if (isLocalHostname(h) && pathname.startsWith('/seller')) return true;
  if (h.endsWith('.vercel.app') && pathname.startsWith('/seller')) return true;

  const sellers = sellerHostnames();
  if (sellers.includes(h)) return true;
  if (h === 'seller.aashansh.org') return true;
  return h.startsWith('seller.') && h !== 'seller.aashansh.org';
}

function isPendingSellerDomain(url) {
  return /seller\.aashansh\.org/i.test(String(url || ''));
}

/** Seller portal base URL — uses same host on Vercel until seller.aashansh.org DNS exists. */
export function resolveSellerPortalOrigin() {
  if (typeof window !== 'undefined') {
    const h = window.location.hostname.toLowerCase();
    if (h.endsWith('.vercel.app') || isLocalHostname(h)) {
      return window.location.origin;
    }
  }

  const configured = (import.meta.env.VITE_SELLER_PORTAL_URL || DEFAULT_SELLER_ORIGIN).replace(
    /\/$/,
    ''
  );

  if (isPendingSellerDomain(configured)) {
    if (typeof window !== 'undefined') return window.location.origin;
    return getCustomerPortalOrigin();
  }

  if (
    typeof window !== 'undefined' &&
    !isLocalHostname(window.location.hostname) &&
    /localhost|127\.0\.0\.1/i.test(configured)
  ) {
    return window.location.origin;
  }

  return configured;
}

export function isCustomerPortal() {
  return !isSellerPortal();
}

export function getCustomerPortalOrigin() {
  if (typeof window !== 'undefined' && window.location?.origin) {
    const h = window.location.hostname.toLowerCase();
    if (h.endsWith('.vercel.app') || isLocalHostname(h)) {
      return window.location.origin;
    }
    if (!isSellerPortal(window.location.hostname, window.location.pathname)) {
      return window.location.origin;
    }
  }
  const fromEnv = import.meta.env.VITE_CUSTOMER_PORTAL_URL;
  const configured = fromEnv || DEFAULT_CUSTOMER_ORIGIN;

  if (
    typeof window !== 'undefined' &&
    window.location?.origin &&
    !isLocalHostname(window.location.hostname) &&
    /localhost|127\.0\.0\.1/i.test(configured)
  ) {
    return window.location.origin;
  }

  if (fromEnv && !/localhost|127\.0\.0\.1/i.test(fromEnv)) {
    return String(fromEnv).replace(/\/$/, '');
  }
  return DEFAULT_CUSTOMER_ORIGIN;
}

/** Host label for UI copy (e.g. e-commerce-snj1.vercel.app or localhost:5173). */
export function getPortalDisplayHost(origin) {
  try {
    return new URL(origin).host;
  } catch {
    return String(origin || '').replace(/^https?:\/\//, '');
  }
}

/** Friendly name on login/register — avoids showing localhost:5173 during local dev. */
export function getPortalLabelForUi(origin, { seller = false } = {}) {
  const host = getPortalDisplayHost(origin);
  if (!host || /localhost|127\.0\.0\.1/i.test(host)) {
    return seller ? 'Aashansh Seller' : 'Aashansh';
  }
  return host;
}

export function getSellerPortalOrigin() {
  return resolveSellerPortalOrigin();
}

export function getPortalLoginUrl() {
  return `${isSellerPortal() ? getSellerPortalOrigin() : getCustomerPortalOrigin()}/login`;
}

function sameOriginPortals() {
  return getSellerPortalOrigin() === getCustomerPortalOrigin();
}

export function getPortalRegisterUrl(options = {}) {
  const base = isSellerPortal() ? getSellerPortalOrigin() : getCustomerPortalOrigin();
  const path = '/register';
  const url = new URL(path, base);
  if (isSellerPortal() || options.seller) url.searchParams.set('portal', 'seller');
  if (options.ref) url.searchParams.set('ref', options.ref);
  return url.toString();
}

/** Full URL on the other portal (cross-domain redirect). */
export function getOtherPortalLoginUrl() {
  if (isSellerPortal()) {
    const url = new URL('/login', getCustomerPortalOrigin());
    return url.toString();
  }
  const url = new URL('/login', getSellerPortalOrigin());
  if (sameOriginPortals()) url.searchParams.set('portal', 'seller');
  return url.toString();
}

export function getOtherPortalRegisterUrl() {
  if (isSellerPortal()) {
    return `${getCustomerPortalOrigin()}/register`;
  }
  const url = new URL('/register', getSellerPortalOrigin());
  if (sameOriginPortals()) url.searchParams.set('portal', 'seller');
  return url.toString();
}

export function portalApiHeaders() {
  return {
    'X-Portal': isSellerPortal() ? 'seller' : 'customer',
  };
}

export function redirectToOtherPortalLogin() {
  window.location.href = getOtherPortalLoginUrl();
}

export { isLocalHostname };

function sanitizePortalRedirect(url) {
  if (!url || typeof window === 'undefined') return url;
  if (!/seller\.aashansh\.org/i.test(url)) return url;
  try {
    const parsed = new URL(url);
    const target = new URL(parsed.pathname || '/login', window.location.origin);
    if (parsed.search) target.search = parsed.search;
    if (!target.searchParams.has('portal') && /seller/i.test(parsed.hostname)) {
      target.searchParams.set('portal', 'seller');
    }
    return target.toString();
  } catch {
    return `${window.location.origin}/login?portal=seller`;
  }
}

export function handleWrongPortalError(err) {
  const data = err?.response?.data;
  if (data?.code === 'WRONG_PORTAL' && data.redirectUrl) {
    window.location.href = sanitizePortalRedirect(data.redirectUrl);
    return true;
  }
  return false;
}
