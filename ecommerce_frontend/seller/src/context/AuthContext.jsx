import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { AUTH_LOGIN } from '../utils/authEndpoints';
import { isSellerPortal } from '../utils/portalHost';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      try {
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
        // No token/user in localStorage — user is not authenticated,
        // skip the refresh-token API call to avoid blocking the UI.
      } catch (_error) {
        // Silent failure is fine here, means user needs to log in
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password, portalOverride) => {
    const portal =
      portalOverride === 'seller' || portalOverride === 'customer'
        ? portalOverride
        : isSellerPortal()
          ? 'seller'
          : 'customer';

    const response = await api.post(
      AUTH_LOGIN,
      { email, password, portal },
      { headers: { 'X-Portal': portal } }
    );
    const { token, user: userData } = response.data || {};
    if (!token || !userData) {
      throw new Error('Invalid login response from server');
    }

    localStorage.setItem('token', token);

    const userObj = {
      ...userData,
      role: userData.role,
      name: userData.firstName,
    };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);

    return userObj;
  };

  const logout = async () => {
    try {
      // Invalidate refresh token on backend
      await api.post('/auth/logout');
    } catch (_err) {
      console.error("Logout API failed, continuing local clear.", _err);
    } finally {
      // Always clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      // Use relative path so we always stay on the same port (5176)
      // regardless of any portal URL configuration.
      window.location.replace('/login');
    }
  };

  /** After registration: persist JWT + user (same shape as login). */
  const setSession = (token, userData) => {
    if (!token || !userData) return null;
    localStorage.setItem('token', token);
    const userObj = {
      ...userData,
      role: userData.role,
      name: userData.firstName,
    };
    localStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
    return userObj;
  };

  /** Merge fields into the logged-in user (e.g. after premium upgrade). */
  const mergeUser = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        ...patch,
        name: patch.firstName != null ? patch.firstName : prev.name,
      };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSession, mergeUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
