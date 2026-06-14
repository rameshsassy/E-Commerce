import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { cartApi } from "@/lib/services";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    setLoading(true);
    try {
      const data = await cartApi.get();
      const arr = data?.items ?? (Array.isArray(data) ? data : []);
      setItems(arr);
      setSubtotal(
        data?.subtotal ??
          arr.reduce(
            (s, i) =>
              s +
              (i.price ??
                (typeof i.product === "object" ? i.product.price : 0)) *
                i.quantity,
            0,
          ),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = async (productId, quantity = 1) => {
    await cartApi.add(productId, quantity);
    await refresh();
  };
  const update = async (itemId, quantity) => {
    await cartApi.update(itemId, quantity);
    await refresh();
  };
  const remove = async (itemId) => {
    await cartApi.remove(itemId);
    await refresh();
  };
  const clear = async () => {
    await cartApi.clear();
    await refresh();
  };

  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        count,
        subtotal,
        refresh,
        add,
        update,
        remove,
        clear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
