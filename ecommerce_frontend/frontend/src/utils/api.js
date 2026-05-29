import axios from 'axios';
import {
  AUTH_CUSTOMER_REGISTER,
  AUTH_LOGIN,
  AUTH_SELLER_REGISTER,
} from './authEndpoints';
import { portalApiHeaders } from './portalHost';

export const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: Allows cookies to be sent and received
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    Object.assign(config.headers, portalApiHeaders());
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth endpoints where a 401 must not trigger refresh-token retry
const AUTH_NO_REFRESH = [
  AUTH_LOGIN,
  AUTH_CUSTOMER_REGISTER,
  AUTH_SELLER_REGISTER,
  '/auth/admin/register',
  '/auth/forgot-password',
  '/auth/refresh-token',
];

const shouldSkipRefreshRetry = (url = '') =>
  AUTH_NO_REFRESH.some((path) => url.includes(path));

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error status is 401 and there is no originalRequest._retry flag,
    // it means the token has expired and we need to refresh it
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !shouldSkipRefreshRetry(originalRequest.url)
    ) {
      originalRequest._retry = true;

      try {
        // Try to get a new access token using the refresh token cookie
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
          withCredentials: true
        });

        if (res.data.token) {
          // Store the new access token
          localStorage.setItem('token', res.data.token);
          
          // Update the original request's authorization header
          originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, force logout and redirect
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
