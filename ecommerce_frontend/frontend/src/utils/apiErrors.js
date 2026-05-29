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

export const API_MISCONFIGURED_MSG =
  'Cannot reach the API. Deploy the backend on Render (see render.yaml), set BACKEND_URL on Vercel to that URL, then redeploy the frontend.';

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (error?.isApiMisconfigured || error?.message === API_MISCONFIGURED_MSG) {
    return API_MISCONFIGURED_MSG;
  }
  if (isNetworkError(error)) {
    return error.response && isHtmlApiResponse(error.response)
      ? API_MISCONFIGURED_MSG
      : fallback;
  }
  const data = error.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (Array.isArray(data?.message)) return data.message.join(' ');
  if (error.message && !/^request failed with status code/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
