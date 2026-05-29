import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { getPortalLoginUrl, isSellerPortal } from '../utils/portalHost';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5s safety

      try {
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Silent refresh check
          const res = await api.post('/auth/refresh-token');
          if (res?.data?.token && res?.data?.user) {
            localStorage.setItem('token', res.data.token);
            const userObj = { ...res.data.user, name: res.data.user.firstName };
            localStorage.setItem('user', JSON.stringify(userObj));
            setUser(userObj);
          }
        }
      } catch (_error) {
        // Silent failure is fine here, means user needs to log in
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        clearTimeout(safetyTimeout);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', {
      email,
      password,
      portal: isSellerPortal() ? 'seller' : 'customer',
    });
    const { token, user: userData } = response.data;

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
      window.location.href = getPortalLoginUrl();
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
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
