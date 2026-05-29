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

/** Backend origin for REST calls and uploaded files (no /api suffix). */
export function resolveApiBaseUrl() {
  const baked = bakedApiBase();
  const inBrowser = typeof window !== 'undefined';
  const onLocal = inBrowser && isLocalDevHost(window.location.hostname);

  if (baked && (!isLocalhostUrl(baked) || onLocal)) {
    return baked;
  }

  if (inBrowser && !onLocal) {
    return window.location.origin;
  }

  return baked || 'http://localhost:5000';
}

/** Axios baseURL — always ends with /api */
export function resolveApiUrl() {
  const base = resolveApiBaseUrl();
  return `${base}/api`;
}
