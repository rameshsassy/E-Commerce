import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { wishlistApi } from "@/lib/services";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(Array.isArray(data) ? data : (data?.items ?? []));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ids = new Set(
    items.map((p) => p._id || p.product?._id).filter(Boolean),
  );

  const has = (id) => ids.has(id);

  const toggle = async (productId) => {
    if (has(productId)) await wishlistApi.remove(productId);
    else await wishlistApi.add(productId);
    await refresh();
  };

  return (
    <WishlistContext.Provider
      value={{ items, ids, loading, refresh, toggle, has }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
