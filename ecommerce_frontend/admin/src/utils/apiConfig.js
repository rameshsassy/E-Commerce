/**
 * API / asset base URL — resolved at runtime in the browser so production
 * never calls http://localhost:5000 when the user is on Vercel or a live domain.
 */

export function isLocalDevHost(hostname = '') {
  const h = String(hostname).toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost');
}

function normalizeApiBase(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '').replace(/\/api\/?$/i, '');
}

function bakedApiBase() {
  return normalizeApiBase(import.meta.env.VITE_API_URL);
}

function isLocalhostUrl(url) {
  return /localhost|127\.0\.0\.1/i.test(String(url || ''));
}

function isVercelHost(hostname = '') {
  return String(hostname).toLowerCase().endsWith('.vercel.app');
}

/** Backend origin for REST calls and uploaded files (no /api suffix). */
export function resolveApiBaseUrl() {
  const baked = bakedApiBase();
  const inBrowser = typeof window !== 'undefined';
  const host = inBrowser ? window.location.hostname : '';
  const onLocal = inBrowser && isLocalDevHost(host);

  // Build-time API host (e.g. Render) — call directly in every environment
  if (baked && !isLocalhostUrl(baked)) {
    return baked;
  }

  // Local dev: same-origin so Vite proxies /api → http://localhost:5000 (see vite.config.js)
  if (onLocal && inBrowser) {
    return window.location.origin;
  }

  // Vercel / live site: same-origin; vercel.json must proxy /api to BACKEND_URL
  if (inBrowser && (isVercelHost(host) || !onLocal)) {
    return window.location.origin;
  }

  return baked || 'http://localhost:5000';
}

/** Axios baseURL — always ends with /api */
export function resolveApiUrl() {
  const base = resolveApiBaseUrl();
  return `${base}/api`;
}
