import axios from 'axios';
import {
  AUTH_CUSTOMER_REGISTER,
  AUTH_LOGIN,
  AUTH_SELLER_REGISTER,
} from './authEndpoints';
import { resolveApiBaseUrl, resolveApiUrl } from './apiConfig';
import { getApiReachabilityMessage, isHtmlApiResponse } from './apiErrors';
import { portalApiHeaders } from './portalHost';
import { getViewportWidthHeader } from './clientDevice';

const baseUrlHolder = {
  toString() {
    return resolveApiBaseUrl();
  },
  valueOf() {
    return resolveApiBaseUrl();
  },
};

/** Use in templates: `${BASE_URL}/uploads/...` — resolves at read time in the browser. */
export const BASE_URL = baseUrlHolder;

export function getImageUrl(path) {
  if (!path) return '';
  const cleanPath = String(path).trim();
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    return cleanPath;
  }
  return `${BASE_URL}/${cleanPath.replace(/\\/g, '/')}`;
}

/** Custom headers that need CORS allow-list on cross-origin APIs (e.g. Render). */

const api = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = resolveApiUrl();
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    Object.assign(config.headers, portalApiHeaders());
    const viewportWidth = getViewportWidthHeader();
    if (viewportWidth) {
      config.headers['X-Viewport-Width'] = viewportWidth;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AUTH_NO_REFRESH = [
  AUTH_LOGIN,
  AUTH_CUSTOMER_REGISTER,
  AUTH_SELLER_REGISTER,
  '/auth/admin/register',
  '/auth/forgot-password',
  '/auth/refresh-token',
  '/admin/signup',
];

const shouldSkipRefreshRetry = (url = '') =>
  AUTH_NO_REFRESH.some((path) => url.includes(path));

function rejectMisconfiguredApi(response) {
  const err = new Error(getApiReachabilityMessage());
  err.isApiMisconfigured = true;
  err.response = response;
  return Promise.reject(err);
}

api.interceptors.response.use(
  (response) => {
    const url = String(response.config?.url || '');
    const base = String(response.config?.baseURL || '');
    if ((url.includes('/auth/') || base.includes('/api')) && isHtmlApiResponse(response)) {
      return rejectMisconfiguredApi(response);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefreshRetry(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(`${resolveApiUrl()}/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
