/**
 * Detect axios / browser network failures (no response from server).
 */
export function isNetworkError(error) {
  if (!error) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const code = error.code || '';
  const message = String(error.message || '');
  if (code === 'ERR_NETWORK' || code === 'ECONNABORTED') return true;
  if (/network error/i.test(message)) return true;
  return !error.response && Boolean(error.request);
}

export function getApiErrorMessage(error, fallback = 'Something went wrong') {
  if (isNetworkError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (Array.isArray(data?.message)) return data.message.join(' ');
  if (error.message && !/^request failed with status code/i.test(error.message)) {
    return error.message;
  }
  return fallback;
}
