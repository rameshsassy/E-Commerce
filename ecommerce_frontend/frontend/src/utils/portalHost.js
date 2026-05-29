/**
 * Customer portal: localhost:5173 (prod: aashansh.org later)
 * Seller portal: seller.localhost:5173 or /seller/* on localhost (prod: seller.aashansh.org later)
 */

const DEFAULT_SELLER_HOSTS = 'seller.localhost';
const DEFAULT_CUSTOMER_ORIGIN = 'http://localhost:5173';
const DEFAULT_SELLER_ORIGIN = 'http://seller.localhost:5173';

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

  const h = String(hostname).toLowerCase();
  if (isLocalHostname(h) && pathname.startsWith('/seller')) return true;

  const sellers = sellerHostnames();
  if (sellers.includes(h)) return true;
  return h.startsWith('seller.');
}

/** Seller portal base URL — local dev never points at .org until DNS is ready. */
export function resolveSellerPortalOrigin() {
  const configured = (import.meta.env.VITE_SELLER_PORTAL_URL || DEFAULT_SELLER_ORIGIN).replace(
    /\/$/,
    ''
  );
  if (/seller\.aashansh\.org/i.test(configured)) {
    return DEFAULT_SELLER_ORIGIN;
  }
  return configured;
}

export function isCustomerPortal() {
  return !isSellerPortal();
}

export function getCustomerPortalOrigin() {
  return (import.meta.env.VITE_CUSTOMER_PORTAL_URL || DEFAULT_CUSTOMER_ORIGIN).replace(/\/$/, '');
}

export function getSellerPortalOrigin() {
  return resolveSellerPortalOrigin();
}

export function getPortalLoginUrl() {
  return `${isSellerPortal() ? getSellerPortalOrigin() : getCustomerPortalOrigin()}/login`;
}

export function getPortalRegisterUrl(options = {}) {
  const base = isSellerPortal() ? getSellerPortalOrigin() : getCustomerPortalOrigin();
  const path = isSellerPortal() || options.seller ? '/register' : '/register';
  const url = new URL(path, base);
  if (options.ref) url.searchParams.set('ref', options.ref);
  return url.toString();
}

/** Full URL on the other portal (cross-domain redirect). */
export function getOtherPortalLoginUrl() {
  return isSellerPortal()
    ? `${getCustomerPortalOrigin()}/login`
    : `${getSellerPortalOrigin()}/login`;
}

export function getOtherPortalRegisterUrl() {
  return isSellerPortal()
    ? `${getCustomerPortalOrigin()}/register`
    : `${getSellerPortalOrigin()}/register`;
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

export function handleWrongPortalError(err) {
  const data = err?.response?.data;
  if (data?.code === 'WRONG_PORTAL' && data.redirectUrl) {
    window.location.href = data.redirectUrl;
    return true;
  }
  return false;
}
