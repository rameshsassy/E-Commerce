import { Link } from "@tanstack/react-router";
import { Trash2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function CartItem({ item, onUpdate, onRemove }) {
  const product =
    typeof item.product === "object"
      ? item.product
      : { _id: item.product, name: "Product", price: item.price };
  const [busy, setBusy] = useState(false);
  const min = product.minOrderQuantity || 1;
  const max = product.maxOrderQuantity || 99;
  const img = product.images?.[0] || "https://placehold.co/200x200/png?text=•";

  const setQty = async (q) => {
    if (q < min || q > max || busy) return;
    setBusy(true);
    try {
      await onUpdate(q);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-4 rounded-xl border bg-card p-3 shadow-card">
      <Link
        to="/products/$id"
        params={{ id: product._id }}
        className="shrink-0"
      >
        <img
          src={img}
          alt={product.name}
          className="h-24 w-24 rounded-lg object-cover"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          to="/products/$id"
          params={{ id: product._id }}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>
        <div className="mt-1 text-base font-bold">
          ₹{(product.price || item.price || 0).toLocaleString("en-IN")}
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center rounded-full border">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={busy || item.quantity <= min}
              onClick={() => setQty(item.quantity - 1)}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="min-w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={busy || item.quantity >= max}
              onClick={() => setQty(item.quantity + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onRemove()}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            Remove
          </Button>
        </div>
        {(product.minOrderQuantity > 1 || product.maxOrderQuantity) && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Min {min} • Max {max}
          </p>
        )}
      </div>
    </div>
  );
}
