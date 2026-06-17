import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";

export function ProductCard({ product }) {
  const { isAuthenticated } = useAuth();
  const { toggle, has } = useWishlist();
  const { add } = useCart();
  const wished = has(product._id);
  // Resolve image to a fully qualified URL (handles relative paths & Google Drive URLs)
  const FALLBACK_IMG = "https://placehold.co/600x600/f3f4f6/94a3b8?text=No+Image";
  const img = getImageUrl(product.images?.[0]) || FALLBACK_IMG;
  const hasDiscount = product.mrp && product.mrp > product.price;

  const onWish = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Please sign in to use wishlist");
    try {
      await toggle(product._id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onAdd = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Please sign in to add to cart");
    try {
      await add(product._id, product.minOrderQuantity || 1);
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: product._id }}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={img}
          alt={product.title || product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_IMG) {
              e.currentTarget.src = FALLBACK_IMG;
            }
          }}
        />
        <button
          type="button"
          onClick={onWish}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/90 backdrop-blur shadow-card transition hover:scale-110"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              wished && "fill-destructive text-destructive",
            )}
          />
        </button>
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
            {Math.round(((product.mrp - product.price) / product.mrp) * 100)}%
            OFF
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium">
          {product.title || product.name}
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold">
            ₹{product.price?.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              ₹{product.mrp?.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          {typeof product.averageRating === "number" &&
          product.averageRating > 0 ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-warning text-warning" />
              <span>{product.averageRating.toFixed(1)}</span>
              <span>({product.totalReviews || 0})</span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">New</span>
          )}
          <Button size="sm" variant="secondary" onClick={onAdd}>
            Add
          </Button>
        </div>
      </div>
    </Link>
  );
}
