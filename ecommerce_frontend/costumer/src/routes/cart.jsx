import { createFileRoute, Link } from "@tanstack/react-router";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { CartItem } from "@/components/customer/CartItem";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your cart — Aashansh" }] }),
  component: CartPage,
});

function CartPage() {
  const { isAuthenticated } = useAuth();
  const { items, subtotal, loading, update, remove, clear } = useCart();

  if (!isAuthenticated) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShoppingBag />}
          title="Sign in to view your cart"
          action={
            <Button asChild>
              <Link to="/auth">Sign in</Link>
            </Button>
          }
        />
      </div>
    );
  }
  if (loading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <EmptyState
          icon={<ShoppingBag />}
          title="Your cart is empty"
          description="Discover great products and add to your cart."
          action={
            <Button asChild>
              <Link to="/products">Shop products</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-end justify-between">
        <h1 className="text-3xl font-bold">
          Your cart{" "}
          <span className="text-base font-normal text-muted-foreground">
            ({items.length})
          </span>
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={async () => {
            await clear();
            toast.success("Cart cleared");
          }}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Clear cart
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {items.map((it) => (
            <CartItem
              key={it._id || String(it.product)}
              item={it}
              onUpdate={async (q) => {
                try {
                  await update(it._id, q);
                } catch (e) {
                  toast.error(e.message);
                }
              }}
              onRemove={async () => {
                try {
                  await remove(it._id);
                  toast.success("Removed");
                } catch (e) {
                  toast.error(e.message);
                }
              }}
            />
          ))}
        </div>
        <aside className="h-fit rounded-2xl border bg-card p-5 shadow-card lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <Row
              label="Subtotal"
              value={`₹${subtotal.toLocaleString("en-IN")}`}
            />
            <Row label="Delivery" value="Calculated at checkout" muted />
            <div className="my-2 border-t" />
            <Row
              label="Total"
              value={`₹${subtotal.toLocaleString("en-IN")}`}
              bold
            />
          </dl>
          <Button asChild size="lg" className="mt-5 w-full">
            <Link to="/checkout">Proceed to checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/products">Continue shopping</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, muted, bold }) {
  return (
    <div
      className={`flex justify-between ${muted ? "text-muted-foreground" : ""} ${bold ? "text-base font-bold" : ""}`}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
