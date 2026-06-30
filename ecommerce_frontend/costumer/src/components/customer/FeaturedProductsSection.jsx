import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { featuredProductsApi, checkoutApi } from "@/lib/services";
import { Heart, Star, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function FeaturedProductsSection() {
  const { data: layouts = [], isLoading, isFetching } = useQuery({
    queryKey: ["publicFeaturedProducts"],
    queryFn: () => featuredProductsApi.list(),
  });

  if (isLoading || isFetching) {
    return (
      <div className="container-page py-10 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!layouts || layouts.length === 0) {
    return null; // Don't show the section if no layouts exist
  }

  return (
    <div className="space-y-12 pb-16">
      {layouts.map((layout) => (
        <LayoutRenderer key={layout._id} layout={layout} />
      ))}
    </div>
  );
}

function LayoutRenderer({ layout }) {
  const { title, subtitle, layoutType, settings, products } = layout;
  
  if (!products || products.length === 0) return null;

  return (
    <section className="container-page py-8">
      {/* Layout Title and Subtitle */}
      {settings.showTitle && title && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
          {settings.showSubtitle && subtitle && (
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Render layout based on type */}
      {layoutType === "grid" ? (
        <GridLayout products={products} settings={settings} />
      ) : layoutType === "carousel" || layoutType === "horizontal_scroll" ? (
        <ScrollLayout products={products} settings={settings} />
      ) : layoutType === "banner_products" ? (
        <BannerProductsLayout products={products} settings={settings} />
      ) : (
        <GridLayout products={products} settings={settings} />
      )}
    </section>
  );
}

// ─── Layout Type Components ──────────────────────────────────────────────────

function GridLayout({ products, settings }) {
  const cols = settings.productsPerRow || 4;
  
  // Map cols count to Tailwind responsive columns
  const gridColsClass = 
    cols === 2 ? "grid-cols-2" :
    cols === 3 ? "grid-cols-2 sm:grid-cols-3" :
    cols === 5 ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" :
    "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"; // Default 4 cols

  return (
    <div className={cn("grid gap-6", gridColsClass)}>
      {products.map((p) => (
        <FeaturedProductCard key={p._id} product={p} settings={settings} />
      ))}
    </div>
  );
}

function ScrollLayout({ products, settings }) {
  return (
    <div className="relative">
      <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scroll-smooth overscroll-x-contain">
        {products.map((p) => (
          <div key={p._id} className="snap-start shrink-0 w-[240px] sm:w-[280px]">
            <FeaturedProductCard product={p} settings={settings} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerProductsLayout({ products, settings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
      {/* Side Banner Card */}
      <div className="md:col-span-4 rounded-3xl bg-gradient-to-br from-[#fef9c3] via-amber-50 to-blue-50 border border-amber-200/40 p-8 flex flex-col justify-between shadow-card min-h-[260px] md:min-h-full">
        <div>
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-100 px-3 py-1 rounded-full">Curated Selection</span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-4 leading-tight">Featured Crafts & More</h3>
          <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">Discover authentic, premium quality products handpicked directly from aspiring local sellers.</p>
        </div>
        <Link to="/products" className="group text-sm font-bold text-slate-800 flex items-center gap-1.5 hover:text-amber-600 transition-colors mt-6">
          Explore Collection <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Horizontal Scroll list of items */}
      <div className="md:col-span-8 flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scroll-smooth overscroll-x-contain">
        {products.map((p) => (
          <div key={p._id} className="snap-start shrink-0 w-[220px] sm:w-[260px]">
            <FeaturedProductCard product={p} settings={settings} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Featured Product Card component ─────────────────────────────────────────

function FeaturedProductCard({ product, settings }) {
  const { isAuthenticated } = useAuth();
  const { toggle, has } = useWishlist();
  const { add } = useCart();
  const navigate = useNavigate();

  const wished = has(product._id);
  const FALLBACK_IMG = "https://placehold.co/600x600/f3f4f6/94a3b8?text=No+Image";
  const img = getImageUrl(product.images?.[0]) || FALLBACK_IMG;
  const hasDiscount = product.mrp && product.mrp > product.price;

  const onWish = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please sign in to use wishlist");
    try {
      await toggle(product._id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please sign in to add to cart");
    try {
      await add(product._id, 1);
      toast.success("Added to cart");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onOrderNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return toast.error("Please sign in to order");
    try {
      const res = await checkoutApi.verifyBuyNow({
        productId: product._id,
        quantity: 1,
        selectedColor: "",
        selectedSize: "",
        purchaseType: "onetime",
      });
      if (res.success) {
        navigate({
          to: "/checkout",
          search: {
            productId: product._id,
            quantity: 1,
            purchaseType: "onetime",
          },
        });
      }
    } catch (err) {
      toast.error(err.message || "Checkout validation failed.");
    }
  };

  return (
    <Link
      to="/product/$id"
      params={{ id: product._id }}
      className="group block overflow-hidden rounded-2xl border bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elegant h-full flex flex-col justify-between"
    >
      <div className="relative aspect-square overflow-hidden bg-muted shrink-0">
        <img
          src={img}
          alt={product.title || product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-slate-800">
            {product.title || product.name}
          </h3>

          {settings.showSellerName && product.sellerName && (
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
              By {product.sellerName}
            </div>
          )}

          {settings.showRating && (
            <div className="mt-1.5 flex items-center gap-1.5">
              {typeof product.averageRating === "number" && product.averageRating > 0 ? (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span>{product.averageRating.toFixed(1)}</span>
                  <span className="text-[10px] text-slate-400">({product.totalReviews || 0})</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">New Arrival</span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {settings.showPrice && (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">
                ₹{product.price?.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.mrp?.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          )}

          {/* Action buttons (Add to Cart / Order Now) */}
          {(settings.showAddToCart || settings.showOrderNow) && (
            <div className="flex gap-2">
              {settings.showAddToCart && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={onAdd}
                  className="flex-1 text-xs h-9 font-bold rounded-xl"
                >
                  Add
                </Button>
              )}
              {settings.showOrderNow && (
                <Button
                  size="sm"
                  onClick={onOrderNow}
                  className="flex-1 text-xs h-9 bg-indigo-950 text-white hover:bg-indigo-900 font-bold rounded-xl"
                >
                  Buy Now
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
