/**
 * Customer portal: aashansh.org (and localhost for dev)
 * Seller portal: seller.aashansh.org (and seller.localhost for dev)
 */

const DEFAULT_SELLER_HOSTS = 'seller.aashansh.org,seller.localhost';
const DEFAULT_CUSTOMER_ORIGIN = 'http://localhost:5173';
const DEFAULT_SELLER_ORIGIN = 'http://seller.localhost:5173';

function parseList(value) {
  return String(value || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function sellerHostnames() {
  return parseList(import.meta.env.VITE_SELLER_PORTAL_HOSTS || DEFAULT_SELLER_HOSTS);
}

export function isSellerPortal(hostname = window.location.hostname) {
  const force = import.meta.env.VITE_PORTAL;
  if (force === 'seller') return true;
  if (force === 'customer') return false;

  const h = String(hostname).toLowerCase();
  const sellers = sellerHostnames();
  if (sellers.includes(h)) return true;
  return h.startsWith('seller.');
}

export function isCustomerPortal() {
  return !isSellerPortal();
}

export function getCustomerPortalOrigin() {
  return (import.meta.env.VITE_CUSTOMER_PORTAL_URL || DEFAULT_CUSTOMER_ORIGIN).replace(/\/$/, '');
}

export function getSellerPortalOrigin() {
  return (import.meta.env.VITE_SELLER_PORTAL_URL || DEFAULT_SELLER_ORIGIN).replace(/\/$/, '');
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

export function handleWrongPortalError(err) {
  const data = err?.response?.data;
  if (data?.code === 'WRONG_PORTAL' && data.redirectUrl) {
    window.location.href = data.redirectUrl;
    return true;
  }
  return false;
}
