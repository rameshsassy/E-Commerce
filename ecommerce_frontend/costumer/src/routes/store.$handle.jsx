import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { storeApi, customerApi } from "@/lib/services";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Star, ShoppingBag, Truck, MapPin, Grid, List as ListIcon, ShieldAlert, ArrowUpDown, ChevronRight } from "lucide-react";
export function getImageUrl(path) {
  if (!path) return "";
  const cleanPath = String(path).trim();
  if (cleanPath.startsWith("http://") || cleanPath.startsWith("https://")) {
    return cleanPath;
  }
  const serverBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
  const baseUrl = serverBase.replace(/\/api$/, "");
  return `${baseUrl}/${cleanPath.replace(/\\/g, "/")}`;
}

export const Route = createFileRoute("/store/$handle")({
  component: PublicStorefront,
});

const THEMES = [
  { id: "light", bg: "#FFFFFF", text: "#1E293B", subtext: "#64748B", cardBg: "#F8F9FB", border: "#E2E8F0" },
  { id: "warm", bg: "#FFFBF5", text: "#2D1B00", subtext: "#92603A", cardBg: "#FEF3E2", border: "#FCD9A0" },
  { id: "dark", bg: "#0F0F1A", text: "#F1F5F9", subtext: "#94A3B8", cardBg: "#1E1E2E", border: "#334155" },
  { id: "minimal", bg: "#F8F9FB", text: "#0F172A", subtext: "#475569", cardBg: "#FFFFFF", border: "#E2E8F0" },
];

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function PublicStorefront() {
  const { handle } = Route.useParams();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  // 1. Fetch store configuration & products
  const storeDataQuery = useQuery({
    queryKey: ["store-public", handle],
    queryFn: () => storeApi.getStoreConfig(handle),
  });

  // 2. Fetch customer orders to check if they purchased a product (for star ratings rule)
  const ordersQuery = useQuery({
    queryKey: ["customer-orders-ratings"],
    queryFn: () => customerApi.listOrders().catch(() => []),
    enabled: isAuthenticated,
  });

  // Filters State (primarily for Free Store layout, but helpful for search/categories globally)
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Category navigation state
  const [activeCat, setActiveCat] = useState(null);
  const [activeSub, setActiveSub] = useState(null);
  const [activePT, setActivePT] = useState(null);

  if (storeDataQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data = storeDataQuery.data;
  if (!data || !data.store) {
    return (
      <div className="container-page py-16 text-center">
        <h2 className="text-2xl font-bold text-foreground">Store not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The store link you are trying to visit is invalid or inactive.</p>
        <Link to="/" className="btn btn-primary mt-6 inline-block">Go Home</Link>
      </div>
    );
  }

  const { store, config, products = [], isSubscribedSeller } = data;
  const theme = THEMES.find(t => t.id === config.themeId) || THEMES[0];
  const accent = config.accentColor || "#F59E0B";

  const orders = ordersQuery.data || [];
  const hasPurchasedProduct = (prodId) => {
    return orders.some(o => o.status === "delivered" && o.items?.some(it => String(it.product?._id || it.product) === String(prodId)));
  };

  // Extract categories dynamically from seller's products
  const uniqueCategories = Array.from(new Set(products.map(p => typeof p.category === "object" ? p.category?.name : p.category).filter(Boolean)));

  // Filter and sort products
  const getFilteredProducts = () => {
    let list = [...products];

    // Hide out of stock rule
    if (config.hideOutOfStock) {
      list = list.filter(p => p.stock && p.stock > 0);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
    }

    // Category filter
    if (selectedCategory !== "all") {
      list = list.filter(p => {
        const cat = typeof p.category === "object" ? p.category?.name : p.category;
        return cat === selectedCategory;
      });
    }

    // Price range filter
    if (priceRange !== "all") {
      if (priceRange === "under500") {
        list = list.filter(p => p.price < 500);
      } else if (priceRange === "500to1000") {
        list = list.filter(p => p.price >= 500 && p.price <= 1000);
      } else if (priceRange === "over1000") {
        list = list.filter(p => p.price > 1000);
      }
    }

    // Sorting filter
    if (sortOrder === "newest") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortOrder === "priceLowHigh") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "priceHighLow") {
      list.sort((a, b) => b.price - a.price);
    }

    return list;
  };

  const filteredProducts = getFilteredProducts();

  // Custom Product Card component
  const StoreProductCard = ({ product }) => {
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const hasSale = product.compareAtPrice && product.compareAtPrice > product.price;
    const salePercent = hasSale ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
    const purchased = hasPurchasedProduct(product._id);

    const handleAddToCart = async (e) => {
      e.preventDefault();
      if (!isAuthenticated) {
        toast.error("Please sign in to add items to cart");
        return;
      }
      setAdding(true);
      try {
        await add(product._id, quantity);
        toast.success(`Added ${quantity} x ${product.title} to cart`);
      } catch (err) {
        toast.error(err.message || "Failed to add to cart");
      } finally {
        setAdding(false);
      }
    };

    const handleBulkBuy = async (e) => {
      e.preventDefault();
      if (!isAuthenticated) {
        toast.error("Please sign in to buy products");
        return;
      }
      const minQty = product.bulkPurchaseMinOrderQuantity || 50;
      setAdding(true);
      try {
        await add(product._id, minQty);
        toast.success(`Added bulk order of ${minQty} items to cart`);
      } catch (err) {
        toast.error(err.message || "Failed to add to cart");
      } finally {
        setAdding(false);
      }
    };

    return (
      <div 
        style={{ background: theme.cardBg, borderColor: theme.border }}
        className="rounded-2xl border overflow-hidden flex flex-col justify-between hover:shadow-lg transition-shadow duration-300"
      >
        <Link to={`/products/${product._id}`} className="block relative aspect-square w-full overflow-hidden bg-slate-200">
          <img 
            src={getImageUrl(product.images?.[0] || product.image)} 
            alt={product.title} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
          {hasSale && (
            <span className="absolute top-3 right-3 bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-sm">
              {salePercent}% OFF
            </span>
          )}
        </Link>

        <div className="p-4 flex-1 flex flex-col justify-between gap-3">
          <div>
            <Link to={`/products/${product._id}`} style={{ color: theme.text }} className="font-semibold text-sm line-clamp-2 hover:underline">
              {product.title}
            </Link>

            {/* Star Rating ONLY if customer has purchased the product */}
            {config.showRatings && purchased && product.averageRating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    style={{ 
                      fill: i < Math.round(product.averageRating) ? accent : "none", 
                      color: i < Math.round(product.averageRating) ? accent : theme.subtext 
                    }} 
                  />
                ))}
                <span style={{ color: theme.subtext }} className="text-[10px] font-medium ml-1">({product.averageRating.toFixed(1)})</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span style={{ color: theme.text }} className="text-base font-bold">{fmt(product.price)}</span>
              {hasSale && (
                <span style={{ color: theme.subtext }} className="text-xs line-through">{fmt(product.compareAtPrice)}</span>
              )}
            </div>

            {/* Quantity controls */}
            <div className="flex items-center justify-between gap-2.5 mt-3">
              <div style={{ borderColor: theme.border, background: theme.bg }} className="flex border rounded-lg overflow-hidden shrink-0">
                <button 
                  type="button" 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ color: theme.text }}
                  className="w-7 h-7 flex items-center justify-center font-bold text-xs hover:bg-slate-100/10 active:scale-95 transition-all"
                >
                  -
                </button>
                <span style={{ color: theme.text }} className="w-7 h-7 flex items-center justify-center font-semibold text-xs">{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(q => q + 1)}
                  style={{ color: theme.text }}
                  className="w-7 h-7 flex items-center justify-center font-bold text-xs hover:bg-slate-100/10 active:scale-95 transition-all"
                >
                  +
                </button>
              </div>

              <button 
                type="button" 
                onClick={handleAddToCart}
                disabled={adding}
                style={{ background: accent }}
                className="flex-1 py-1.5 rounded-lg text-white font-bold text-xs shadow hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Add to Cart
              </button>
            </div>

            {/* Bulk order option only for paid sellers */}
            {isSubscribedSeller && product.bulkPurchaseEnabled && (
              <button 
                type="button" 
                onClick={handleBulkBuy}
                disabled={adding}
                className="w-full mt-2 py-1.5 border border-indigo-600 bg-indigo-50/5 hover:bg-indigo-500 hover:text-white text-indigo-500 font-bold text-xs rounded-lg transition-all"
              >
                📦 Bulk Buy (Min: {product.bulkPurchaseMinOrderQuantity || 50})
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const SectionHeader = ({ title }) => (
    <div className="flex items-center gap-2 mb-6">
      <div style={{ background: accent }} className="w-1 h-5 rounded" />
      <h3 style={{ color: theme.text }} className="text-lg font-bold">{title}</h3>
    </div>
  );

  const renderBlock = (block) => {
    if (!block.visible) return null;
    const bc = block.config;
    const cols = config.gridColumns || 4;

    if (block.type === "section_products") {
      if (bc.sectionType === "collections") {
        const cols2 = bc.collections || [];
        if (!cols2.length) return null;
        return (
          <div key={block.id} className="py-10 border-b" style={{ borderColor: theme.border }}>
            <SectionHeader title="Collections" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cols2.map(c => (
                <div key={c.id} style={{ background: accent + "10", borderColor: accent + "30" }} className="border rounded-2xl p-4 shadow-sm">
                  <h4 style={{ color: theme.text }} className="font-bold text-base">{c.name}</h4>
                  {c.description && <p style={{ color: theme.subtext }} className="text-xs mt-1">{c.description}</p>}
                  <div className="flex gap-2.5 mt-4">
                    {c.productIds.slice(0, 3).map(pid => {
                      const p = products.find(x => String(x._id || x.id) === String(pid));
                      return p ? (
                        <Link key={pid} to={`/products/${p._id}`} className="w-14 h-14 rounded-lg overflow-hidden border bg-white flex-shrink-0">
                          <img src={getImageUrl(p.images?.[0] || p.image)} alt="" className="w-full h-full object-cover" />
                        </Link>
                      ) : null;
                    })}
                  </div>
                  <div style={{ color: accent }} className="text-xs font-bold mt-4 flex items-center gap-1 cursor-pointer">
                    View collection <ChevronRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      const opt = SECTION_OPTIONS.find(o => o.id === bc.sectionType);
      const filteredProds = (bc.productIds || [])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean)
        .filter(p => config.hideOutOfStock ? (p.stock && p.stock > 0) : true);

      if (!filteredProds.length) return null;

      return (
        <div key={block.id} className="py-10 border-b" style={{ borderColor: theme.border }}>
          <SectionHeader title={block.label || opt?.label} />
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} gap-6`}>
            {filteredProds.slice(0, cols * 2).map(p => <StoreProductCard key={p._id || p.id} product={p} />)}
          </div>
        </div>
      );
    }

    if (block.type === "category_nav") {
      const cats = bc.categories || [];
      if (!cats.length) return null;
      const curCat = cats.find(c => c.id === activeCat);
      const curSub = curCat?.subCategories?.find(s => s.id === activeSub);
      const curPT  = curSub?.productTypes?.find(pt => pt.id === activePT);
      const filteredProds = curPT ? (curPT.productIds || [])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean) : [];

      return (
        <div key={block.id} className="py-10 border-b" style={{ borderColor: theme.border }}>
          <SectionHeader title={block.label || "Category Navigator"} />
          
          {/* Main categories */}
          <div className="flex gap-2 flex-wrap mb-4">
            {cats.map(c => (
              <button 
                key={c.id} 
                onClick={() => { setActiveCat(activeCat === c.id ? null : c.id); setActiveSub(null); setActivePT(null); }}
                style={{ 
                  borderColor: activeCat === c.id ? accent : theme.border, 
                  background: activeCat === c.id ? accent : theme.cardBg,
                  color: activeCat === c.id ? "#fff" : theme.text
                }}
                className="px-4 py-2 border rounded-full text-xs font-semibold shadow-sm transition-all"
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Sub categories */}
          {curCat && (
            <div className="flex gap-2 flex-wrap mb-4 pl-4 border-l-2" style={{ borderColor: theme.border }}>
              {curCat.subCategories.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => { setActiveSub(activeSub === s.id ? null : s.id); setActivePT(null); }}
                  style={{ 
                    borderColor: activeSub === s.id ? accent : theme.border, 
                    background: activeSub === s.id ? accent + "18" : theme.bg,
                    color: activeSub === s.id ? accent : theme.subtext
                  }}
                  className="px-3.5 py-1.5 border rounded-full text-xs font-semibold transition-all"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Product Types */}
          {curSub && (
            <div className="flex gap-2 flex-wrap mb-6 pl-8 border-l-2" style={{ borderColor: theme.border }}>
              {curSub.productTypes.map(pt => (
                <button 
                  key={pt.id} 
                  onClick={() => setActivePT(activePT === pt.id ? null : pt.id)}
                  style={{ 
                    borderColor: activePT === pt.id ? accent : theme.border, 
                    background: activePT === pt.id ? accent + "10" : theme.bg,
                    color: activePT === pt.id ? accent : theme.subtext
                  }}
                  className="px-3 py-1 border rounded-full text-[11px] font-semibold transition-all"
                >
                  {pt.name}
                </button>
              ))}
            </div>
          )}

          {/* Filtered products grid */}
          {filteredProds.length > 0 ? (
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${config.gridColumns || 4} gap-6`}>
              {filteredProds.map(p => <StoreProductCard key={p._id || p.id} product={p} />)}
            </div>
          ) : (
            activePT && <p style={{ color: theme.subtext }} className="text-xs italic pl-8">No products found in this type.</p>
          )}
        </div>
      );
    }

    if (block.type === "spotlight") {
      const p = bc.productId ? products.find(x => String(x._id || x.id) === String(bc.productId)) : null;
      const imgLeft = bc.imagePosition === "left";
      return (
        <div 
          key={block.id} 
          style={{ borderColor: theme.border, background: theme.cardBg }}
          className={`my-10 border rounded-2xl overflow-hidden flex flex-col ${imgLeft ? "md:flex-row" : "md:flex-row-reverse"} shadow-sm`}
        >
          {bc.imageUrl && (
            <div className="w-full md:w-2/5 shrink-0 aspect-video md:aspect-square">
              <img src={getImageUrl(bc.imageUrl)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 p-8 flex flex-col justify-center gap-4">
            {bc.title && <h3 style={{ color: theme.text }} className="text-2xl font-extrabold tracking-tight">{bc.title}</h3>}
            {bc.subtitle && <p style={{ color: theme.subtext }} className="text-sm leading-relaxed">{bc.subtitle}</p>}
            {p && (
              <div className="flex items-center gap-3">
                <span style={{ color: theme.text }} className="text-lg font-bold">{fmt(p.price)}</span>
                <Link 
                  to={`/products/${p._id}`}
                  style={{ background: accent }}
                  className="px-5 py-2 rounded-xl text-white font-bold text-xs hover:opacity-90 shadow active:scale-95 transition-all"
                >
                  {bc.buttonType === "cart" ? "🛒 Buy Now" : "📦 Order Bulk"}
                </Link>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (block.type === "bulk_row") {
      const rowProds = (bc.productOrder || [])
        .map(id => products.find(p => String(p._id || p.id) === String(id)))
        .filter(Boolean);
      if (!rowProds.length) return null;

      return (
        <div key={block.id} className="py-10 border-b" style={{ borderColor: theme.border }}>
          <SectionHeader title={block.label || "Bulk Order Store"} />
          <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${cols} gap-6`}>
            {rowProds.slice(0, cols).map(p => <StoreProductCard key={p._id || p.id} product={p} />)}
          </div>
        </div>
      );
    }

    if (block.type === "reviews") {
      const reviewsList = bc.reviews || [];
      if (!reviewsList.length) return null;
      return (
        <div key={block.id} className="py-10 border-b" style={{ borderColor: theme.border }}>
          <SectionHeader title={block.label || "Artisan Feedback"} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviewsList.map(r => (
              <div key={r.id} style={{ background: theme.cardBg, borderColor: theme.border }} className="border rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <img src={r.avatar || "https://i.pravatar.cc/60?img=47"} alt="" className="w-10 h-10 rounded-full object-cover border" />
                  <div>
                    <div style={{ color: theme.text }} className="font-bold text-sm">{r.name}</div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={10} style={{ fill: i < r.rating ? accent : "none", color: i < r.rating ? accent : theme.subtext }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ color: theme.text }} className="font-bold text-xs">{r.title}</div>
                <p style={{ color: theme.subtext }} className="text-xs leading-normal">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ background: theme.bg, color: theme.text }} className="min-h-screen pb-16">
      
      {/* 1. Promo banner */}
      {config.promoBannerEnabled && isSubscribedSeller && (
        <div style={{ background: accent }} className="text-white text-center py-2 px-4 font-bold text-xs uppercase tracking-wider flex justify-between items-center container-page">
          <span>{config.promoBannerText || "Exclusive Discounts Active Now!"}</span>
          {config.promoBannerBtnLabel && (
            <button className="border border-white hover:bg-white hover:text-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition-colors">
              {config.promoBannerBtnLabel}
            </button>
          )}
        </div>
      )}

      {/* 2. Announcement Ticker Marquee */}
      {config.tickerEnabled && isSubscribedSeller && config.tickerText && (
        <div style={{ background: theme.cardBg, borderColor: theme.border }} className="border-b py-2 text-xs overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee pl-4">
            {config.tickerText}
          </div>
        </div>
      )}

      {/* 3. Header Profile section */}
      <div style={{ borderColor: theme.border }} className="border-b py-8">
        <div className="container-page flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            {store.logo ? (
              <div className="w-16 h-16 rounded-2xl border overflow-hidden bg-white shrink-0">
                <img src={getImageUrl(store.logo)} alt={store.storeName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div style={{ background: accent }} className="w-16 h-16 rounded-2xl text-white font-extrabold text-2xl flex items-center justify-center shrink-0">
                {store.storeName[0]}
              </div>
            )}
            <div>
              <h1 style={{ color: theme.text }} className="text-2xl font-extrabold tracking-tight">{store.storeName}</h1>
              {store.tagline && <p style={{ color: theme.subtext }} className="text-xs font-semibold mt-1">{store.tagline}</p>}
            </div>
          </div>
          {store.detailedAddress && (
            <div style={{ color: theme.subtext }} className="flex items-center gap-1.5 text-xs text-right max-w-xs sm:self-start">
              <MapPin size={14} className="shrink-0" />
              <span>{store.detailedAddress}</span>
            </div>
          )}
        </div>
      </div>

      {/* 4. Banner Showcase */}
      {isSubscribedSeller && config.bannerTitle && (
        <div 
          style={{
            backgroundImage: config.bannerUrl ? `url(${getImageUrl(config.bannerUrl)})` : "none",
            backgroundColor: accent + "10",
          }}
          className="bg-cover bg-center py-20 text-center relative border-b"
        >
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" />
          <div className="relative container-page max-w-xl mx-auto text-white">
            <h2 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">{config.bannerTitle}</h2>
            {config.bannerSubtitle && <p className="text-sm mt-3 drop-shadow text-white/90">{config.bannerSubtitle}</p>}
            {config.bannerBtnLabel && (
              <button 
                type="button"
                onClick={() => {
                  const el = document.getElementById("store-products-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                style={{ background: accent }}
                className="mt-6 px-6 py-2.5 rounded-xl font-bold text-sm shadow hover:opacity-95 active:scale-95 transition-all text-white"
              >
                {config.bannerBtnLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 5. Main page layout blocks */}
      <div id="store-products-anchor" className="container-page mt-8">
        
        {(!isSubscribedSeller || !config.blocks || config.blocks.filter(b => b.visible).length === 0) ? (
          /* Free seller standard layout: basic filters & full product grid */
          <div className="space-y-8">
            
            {/* Standard Filters bar */}
            <div style={{ background: theme.cardBg, borderColor: theme.border }} className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  className="px-4 py-2 border rounded-xl text-xs outline-none w-full sm:w-48"
                />

                {/* Category selection */}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  className="px-3 py-2 border rounded-xl text-xs outline-none"
                >
                  <option value="all">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Price range */}
                <select
                  value={priceRange}
                  onChange={e => setPriceRange(e.target.value)}
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  className="px-3 py-2 border rounded-xl text-xs outline-none"
                >
                  <option value="all">All Prices</option>
                  <option value="under500">Under ₹500</option>
                  <option value="500to1000">₹500 - ₹1000</option>
                  <option value="over1000">Over ₹1000</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="flex items-center gap-2">
                <ArrowUpDown size={14} style={{ color: theme.subtext }} />
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  style={{ background: theme.bg, borderColor: theme.border, color: theme.text }}
                  className="px-3 py-2 border rounded-xl text-xs outline-none font-medium"
                >
                  <option value="newest">Newest to Oldest</option>
                  <option value="priceLowHigh">Price: Low to High</option>
                  <option value="priceHighLow">Price: High to Low</option>
                </select>
              </div>
            </div>

            <SectionHeader title="All Products" />
            
            {/* Products grid */}
            {filteredProducts.length === 0 ? (
              <div style={{ color: theme.subtext }} className="text-center py-16 text-sm italic">No products match the selected criteria.</div>
            ) : (
              <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${config.gridColumns || 4} gap-6`}>
                {filteredProducts.map(p => <StoreProductCard key={p._id || p.id} product={p} />)}
              </div>
            )}

            {/* Locked Bulk Order row for Free Sellers */}
            <div 
              style={{ borderColor: theme.border, background: theme.cardBg }}
              className="mt-12 p-8 border-2 border-dashed rounded-2xl text-center max-w-md mx-auto"
            >
              <div className="text-2xl mb-2">🔒</div>
              <h4 style={{ color: theme.text }} className="font-bold text-sm">Bulk Order Row</h4>
              <p style={{ color: theme.subtext }} className="text-xs mt-1">Bulk Order is available only for paid subscribers.</p>
            </div>

          </div>
        ) : (
          /* Premium layout: render custom layout blocks */
          config.blocks.map(b => renderBlock(b))
        )}

      </div>

    </div>
  );
}
