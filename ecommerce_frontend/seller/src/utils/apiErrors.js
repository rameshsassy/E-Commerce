/**
 * Detect axios / browser network failures (no response from server).
 */
export function isHtmlApiResponse(response) {
  if (!response) return false;
  const ct = String(response.headers?.['content-type'] || '').toLowerCase();
  if (ct.includes('text/html')) return true;
  const data = response.data;
  if (typeof data === 'string' && /^\s*</.test(data)) return true;
  return false;
}

export function isNetworkError(error) {
  if (!error) return false;
  if (error.isApiMisconfigured) return true;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const code = error.code || '';
  const message = String(error.message || '');
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  if (/network error/i.test(message)) return true;
  if (isHtmlApiResponse(error.response)) return true;
  return !error.response && Boolean(error.request);
}

function isLocalDev() {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.localhost');
}

function isVercelProd() {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.toLowerCase().endsWith('.vercel.app');
}

/** User-facing hint when /api is unreachable (HTML or network error). */
export function getApiReachabilityMessage() {
  if (isLocalDev()) {
    return 'Cannot reach the API. In the project root run: npm run dev (starts the API on port 5000). Keep that terminal open, then refresh this page.';
  }
  if (isVercelProd()) {
    return 'Cannot reach the API on Vercel. In Vercel → Settings → Environment Variables add MONGO_URI, JWT_SECRET, and ADMIN_SECRET_KEY, then redeploy. Test: /api/health must return JSON (not this page). See ecommerce_frontend/frontend/DEPLOY.md.';
  }
  return 'Cannot reach the API. Check that the backend server is running and CORS is configured for this site.';
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  const reachability = getApiReachabilityMessage();
  if (error?.isApiMisconfigured) {
    return reachability;
  }
  if (isNetworkError(error)) {
    if (!error.response || isHtmlApiResponse(error.response)) {
      return reachability;
    }
    return fallback;
  }
  const data = error.response?.data;
  if (typeof data === 'string' && data.trim() && !data.trim().startsWith('<')) {
    return data.trim();
  }
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (Array.isArray(data?.message)) return data.message.join(' ');
  if (error.message && !/^request failed with status code/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
