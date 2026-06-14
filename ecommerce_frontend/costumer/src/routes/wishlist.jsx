import { createFileRoute, Link } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { useWishlist } from "@/contexts/WishlistContext";
import { ProductCard } from "@/components/customer/ProductCard";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({ meta: [{ title: "My wishlist — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <WishlistPage />
    </ProtectedRoute>
  ),
});

function WishlistPage() {
  const { items, loading } = useWishlist();
  if (loading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Wishlist</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {items.length} item{items.length !== 1 ? "s" : ""}
      </p>
      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={<Heart />}
            title="Your wishlist is empty"
            description="Tap the heart icon on any product to save it here."
            action={
              <Button asChild>
                <Link to="/products">Explore products</Link>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard
                key={p._id || p.product?._id}
                product={p.product || p}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
