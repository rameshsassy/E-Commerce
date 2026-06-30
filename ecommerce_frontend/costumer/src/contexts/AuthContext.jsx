import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { userApi, authApi } from "@/lib/services";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const u = await userApi.getProfile();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res && res.token && typeof window !== "undefined") {
      localStorage.setItem("token", res.token);
    }
    await refresh();
  };

  const register = async (data) => {
    await authApi.register(data);
    const res = await authApi
      .login({ email: data.email, password: data.password })
      .catch(() => null);
    if (res && res.token && typeof window !== "undefined") {
      localStorage.setItem("token", res.token);
    }
    await refresh();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refresh,
        login,
        register,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
