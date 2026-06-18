import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productApi, reviewApi, customerApi, deliveryApi, bulkPurchaseApi, checkoutApi } from "@/lib/services";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Rating } from "@/components/customer/ReviewCard";
import { LoadingSpinner, EmptyState } from "@/components/customer/EmptyState";
import {
  Heart,
  ShoppingBag,
  Truck,
  Store,
  Star,
  Minus,
  Plus,
  MapPin,
  Upload,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  component: ProductDetailRoute,
});

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ value, size = 13 }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <span className="inline-flex text-yellow-400" style={{ fontSize: size, letterSpacing: 1 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < full ? "★" : i === full && half ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

// ─── Image Gallery ────────────────────────────────────────────────────────────
function Gallery({ images }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const FALLBACK_IMG = "https://placehold.co/800x800/f3f4f6/94a3b8?text=No+Image";

  const activeImage = getImageUrl(images[active]) || FALLBACK_IMG;

  return (
    <div>
      <div
        onClick={() => setLightbox(true)}
        className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 cursor-zoom-in bg-white hover:shadow-elegant transition-shadow duration-300"
      >
        <img src={activeImage} alt="Product" className="w-full h-full object-cover block" />
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
          🔍 Click to zoom
        </div>
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2 mt-3.5">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "aspect-square rounded-xl overflow-hidden p-0 cursor-pointer bg-none transition-all duration-150 border-2",
                active === i ? "border-indigo-950 scale-95" : "border-slate-200 hover:border-slate-400"
              )}
            >
              <img src={getImageUrl(img) || FALLBACK_IMG} alt={`thumbnail ${i + 1}`} className="w-full h-full object-cover block" />
            </button>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          className="fixed inset-0 bg-slate-950/85 z-[300] flex items-center justify-center p-8 cursor-zoom-out animate-in fade-in duration-200"
        >
          <img src={activeImage} alt="Zoomed product" className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-6 right-7 bg-white/10 hover:bg-white/20 border-none text-white w-10 h-10 rounded-full flex items-center justify-center text-lg cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Pincode Checker ──────────────────────────────────────────────────────────
function PincodeChecker({ productId }) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const check = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError("Enter a valid 6-digit pincode");
      setResult(null);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await deliveryApi.check(productId, pin);
      setResult({
        available: res.available,
        message: res.message,
        estimatedDeliveryDate: res.estimatedDeliveryDate,
      });
    } catch (e) {
      setResult({
        available: false,
        message: e.message || "Failed to check serviceability.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2.5">
      <div className="flex gap-2">
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
            setError("");
          }}
          placeholder="Enter pincode"
          className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none text-slate-800 focus:border-indigo-950 transition-colors"
        />
        <Button onClick={check} disabled={busy} className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold px-4">
          {busy ? <LoadingSpinner className="h-4 w-4" /> : "Check"}
        </Button>
      </div>
      {error && <div className="text-xs text-red-500 mt-1.5 font-medium">{error}</div>}
      {result && (
        <div
          className={cn(
            "mt-3 border rounded-xl px-3.5 py-2.5 text-xs flex items-center gap-2 font-medium",
            result.available
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          )}
        >
          <span>{result.available ? "✅" : "❌"}</span>
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}

// ─── Policy Card ──────────────────────────────────────────────────────────────
function PolicyCard({ icon, label, policy }) {
  const [open, setOpen] = useState(false);
  const available = policy && policy.enabled !== false;
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all duration-150">
      <button
        onClick={() => available && setOpen(!open)}
        className={cn(
          "w-full px-3.5 py-3.5 bg-white border-none flex items-center gap-2.5 text-left",
          available ? "cursor-pointer" : "cursor-default"
        )}
      >
        <span className="text-lg">{icon}</span>
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-800">{label}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-semibold">
            <span className={cn("w-1.5 h-1.5 rounded-full", available ? "bg-emerald-500" : "bg-slate-300")} />
            {available ? "Available" : "Not available"}
          </div>
        </div>
        {available && (
          <span className={cn("text-slate-400 text-xs transition-transform duration-200", open && "transform rotate-180")}>
            ▾
          </span>
        )}
      </button>
      {open && available && (
        <div className="px-3.5 pb-3 pl-10 text-[11px] text-slate-500 leading-relaxed border-t border-slate-50 pt-2 bg-slate-50">
          {policy.terms || "Subject to store policy terms."}
        </div>
      )}
    </div>
  );
}

function ProductDetailRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const { toggle, has } = useWishlist();

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [purchaseType, setPurchaseType] = useState("onetime");
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [view, setView] = useState("customer");

  // Dialog states
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkQty, setBulkQty] = useState(50);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  // Review states
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revRating, setRevRating] = useState(5);
  const [revTitle, setRevTitle] = useState("");
  const [revComment, setRevComment] = useState("");
  const [revBusy, setRevBusy] = useState(false);

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const data = await productApi.get(id);
      return data;
    },
    onSuccess: (data) => {
      // Set defaults based on variants
      if (data?.variants?.length > 0) {
        const firstColor = data.variants.find((v) => v.type === "color");
        if (firstColor) setSelectedColor(firstColor.value);
        const firstSize = data.variants.find((v) => v.type === "size");
        if (firstSize) setSelectedSize(firstSize.value);
      }
    },
  });

  const reviewsQ = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewApi.list(id),
  });

  const eligibility = useQuery({
    queryKey: ["reviews-eligibility", id],
    queryFn: () => reviewApi.checkEligibility(id),
    enabled: isAuthenticated,
  });

  const p = product.data;
  const FALLBACK_IMG = "https://placehold.co/800x800/f3f4f6/94a3b8?text=No+Image";
  const reviews = Array.isArray(reviewsQ.data)
    ? reviewsQ.data
    : reviewsQ.data?.reviews || [];

  if (product.isLoading) {
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-indigo-950" />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container-page py-16">
        <EmptyState title="Product not found" />
      </div>
    );
  }

  const permissions = p.permissions || {
    allowOneTimePurchase: true,
    allowSubscriptionPurchase: false,
    allowCustomPurchase: false,
    allowBulkPurchase: false,
  };

  const plan = p.sellerPlan || "free";
  const wished = has(p._id);
  const hasDiscount = p.compareAtPrice && p.compareAtPrice > p.price;
  const sellerName = typeof p.sellerId === "object" ? p.sellerId.businessName || p.sellerId.firstName : "";
  const catName = p.category || "";
  const outOfStock = p.stock <= 0 && !p.continueSellingWhenOutOfStock;

  // Build variants
  const colorVariants = p.variants?.filter((v) => v.type === "color") || [];
  const sizeVariants = p.variants?.filter((v) => v.type === "size") || [];

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart.");
      return;
    }
    try {
      await add(p._id, qty, selectedColor, selectedSize, purchaseType);
      toast.success("Added to cart successfully.");
    } catch (e) {
      toast.error(e.message || "Failed to add to cart.");
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout.");
      return;
    }
    try {
      const res = await checkoutApi.verifyBuyNow({
        productId: p._id,
        quantity: qty,
        selectedColor,
        selectedSize,
        purchaseType,
      });
      if (res.success) {
        navigate({
          to: "/checkout",
          search: {
            productId: p._id,
            quantity: qty,
            color: selectedColor || undefined,
            size: selectedSize || undefined,
            purchaseType,
          },
        });
      }
    } catch (e) {
      toast.error(e.message || "Checkout validation failed.");
    }
  };

  const handleBulkSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit bulk requests.");
      return;
    }
    if (bulkQty < (p.bulkPurchaseMinOrderQuantity || 50)) {
      toast.error(`Minimum bulk quantity required is ${p.bulkPurchaseMinOrderQuantity || 50}`);
      return;
    }
    setBulkBusy(true);
    try {
      await bulkPurchaseApi.request({
        productId: p._id,
        sellerId: p.sellerId?._id || p.sellerId,
        quantity: bulkQty,
        message: bulkMessage,
      });
      toast.success("Bulk purchase request submitted successfully!");
      setBulkOpen(false);
      setBulkMessage("");
    } catch (e) {
      toast.error(e.message || "Failed to submit bulk request.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!revComment.trim()) {
      toast.error("Please write a comment.");
      return;
    }
    setRevBusy(true);
    try {
      await reviewApi.submit({
        productId: p._id,
        orderId: eligibility.data?.orderId,
        rating: revRating,
        title: revTitle,
        comment: revComment,
      });
      toast.success("Review submitted successfully!");
      setReviewOpen(false);
      setRevTitle("");
      setRevComment("");
      qc.invalidateQueries({ queryKey: ["reviews", id] });
      qc.invalidateQueries({ queryKey: ["reviews-eligibility", id] });
    } catch (e) {
      toast.error(e.message || "Failed to submit review.");
    } finally {
      setRevBusy(false);
    }
  };

  // Build product images array
  const galleryImages = p.images?.length > 0 ? p.images : [FALLBACK_IMG];

  return (
    <div className="font-sans bg-slate-50 min-h-screen">
      <div className="max-w-[1180px] mx-auto px-6 py-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* LEFT: Image Gallery */}
          <div className="sticky top-24 self-start">
            <Gallery images={galleryImages} />
          </div>

          {/* RIGHT: Buy box / Product info */}
          <div>
            <div className="text-[11px] font-bold text-yellow-500 tracking-wider uppercase mb-1.5">
              {catName || "Handicrafts & Apparel"}
            </div>
            <h1 className="font-bold text-2xl text-indigo-950 leading-snug mb-3">
              {p.title || p.name}
            </h1>

            <div className="flex items-center gap-2 mb-2">
              <Stars value={p.averageRating || 0} size={14} />
              <span className="text-sm font-bold text-slate-800">
                {(p.averageRating || 0).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">
                ({p.totalReviews || 0} verified reviews)
              </span>
            </div>

            {sellerName && (
              <div className="text-xs text-slate-500 mb-5 flex items-center gap-1">
                Sold by <span className="text-indigo-950 font-bold hover:underline cursor-pointer">{sellerName}</span>
              </div>
            )}

            {/* Price block */}
            <div className="flex items-baseline gap-2.5 mb-1.5">
              <span className="text-3xl font-extrabold text-indigo-950">
                ₹{p.price?.toLocaleString("en-IN")}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-slate-400 line-through">
                    ₹{p.compareAtPrice?.toLocaleString("en-IN")}
                  </span>
                  <span className="bg-rose-600 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-lg">
                    {Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mb-4">
              Inclusive of all taxes
            </div>

            {/* SKU urgency */}
            {!outOfStock && p.stock > 0 && p.stock < 10 && (
              <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5 text-xs font-bold text-orange-700 mb-5">
                🔥 Hurry! Only {p.stock} left in stock
              </div>
            )}

            {outOfStock && (
              <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 mb-5">
                🚫 Currently Out of Stock
              </div>
            )}

            {/* Color variants */}
            {colorVariants.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Colour: <span className="text-indigo-950">{selectedColor || "Select Color"}</span>
                </div>
                <div className="flex gap-2.5">
                  {colorVariants.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => setSelectedColor(c.value)}
                      title={c.value}
                      className={cn(
                        "w-10 h-10 rounded-xl p-0.5 cursor-pointer bg-white transition-all border-2 flex items-center justify-center overflow-hidden",
                        selectedColor === c.value ? "border-indigo-950" : "border-slate-200"
                      )}
                    >
                      {c.colorHex ? (
                        <span className="w-full h-full rounded-lg" style={{ backgroundColor: c.colorHex }} />
                      ) : c.image ? (
                        <img src={getImageUrl(c.image)} alt={c.value} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs font-semibold">{c.value}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size variants */}
            {sizeVariants.length > 0 && (
              <div className="mb-5">
                <div className="text-xs font-bold text-slate-700 mb-2">Size</div>
                <div className="flex gap-2">
                  {sizeVariants.map((s) => (
                    <button
                      key={s._id}
                      onClick={() => setSelectedSize(s.value)}
                      className={cn(
                        "px-4.5 py-2 rounded-xl text-xs font-bold cursor-pointer border-2 transition-colors",
                        selectedSize === s.value
                          ? "border-indigo-950 bg-indigo-50/50 text-indigo-950"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      )}
                    >
                      {s.value}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Type */}
            <div className="mb-5">
              <div className="text-xs font-bold text-slate-700 mb-2">Purchase Type</div>
              {plan === "free" ? (
                <div className="text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-xl px-4.5 py-3">
                  One-time Purchase <span className="text-[10px] text-slate-400 ml-1.5">(Subscription & Custom Made not supported on Free stores)</span>
                </div>
              ) : (
                <select
                  value={purchaseType}
                  onChange={(e) => setPurchaseType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none text-slate-800 focus:border-indigo-950 transition-colors bg-white cursor-pointer"
                >
                  <option value="onetime">One-time Purchase</option>
                  {permissions.allowSubscriptionPurchase && (
                    <option value="subscription">Subscription (every month)</option>
                  )}
                  {permissions.allowCustomPurchase && (
                    <option value="custom">Custom Made (to specifications)</option>
                  )}
                </select>
              )}
            </div>

            {/* Qty, Cart, Buy Buttons */}
            <div className="flex gap-2.5 mb-3">
              <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={outOfStock}
                  className="w-10 h-11 border-none bg-slate-50 flex items-center justify-center font-bold text-slate-600 cursor-pointer disabled:opacity-50"
                >
                  −
                </button>
                <div className="w-11 text-center font-bold text-slate-800 text-sm">{qty}</div>
                <button
                  onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))}
                  disabled={outOfStock || qty >= (p.stock || 99)}
                  className="w-10 h-11 border-none bg-slate-50 flex items-center justify-center font-bold text-slate-600 cursor-pointer disabled:opacity-50"
                >
                  +
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={outOfStock}
                className="flex-1 h-11 bg-yellow-400 hover:bg-yellow-500 text-indigo-950 font-bold rounded-xl text-sm border-none shadow-sm disabled:opacity-50"
              >
                🛒 Add to Cart
              </Button>
            </div>

            <div className="flex gap-2.5 mb-5">
              <Button
                onClick={handleBuyNow}
                disabled={outOfStock}
                className="flex-1 h-11 bg-indigo-950 hover:bg-indigo-900 text-white font-bold rounded-xl text-sm border-none shadow-sm disabled:opacity-50"
              >
                ⚡ Buy Now / Order Now
              </Button>
            </div>

            {/* Bulk Purchase Area */}
            <div className="mb-5">
              {plan === "free" ? (
                <div className="text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-center">
                  📦 Bulk Purchase Not Available
                </div>
              ) : permissions.allowBulkPurchase ? (
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm border-none shadow-sm">
                      📦 Request Bulk Purchase
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[420px] rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-indigo-950 font-bold">
                        <Package className="h-5 w-5" /> Request Bulk Quote
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 my-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Quantity Needed (Min: {p.bulkPurchaseMinOrderQuantity || 50})
                        </label>
                        <Input
                          type="number"
                          value={bulkQty}
                          onChange={(e) => setBulkQty(Number(e.target.value))}
                          min={p.bulkPurchaseMinOrderQuantity || 50}
                          className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-950"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Requirements / Custom Message
                        </label>
                        <Textarea
                          placeholder="Provide details about shipping details, custom logos, dates, etc."
                          value={bulkMessage}
                          onChange={(e) => setBulkMessage(e.target.value)}
                          rows={4}
                          className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-950"
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={bulkBusy}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-5"
                      >
                        {bulkBusy ? <LoadingSpinner className="h-4 w-4" /> : "Submit Request"}
                      </Button>
                      <Button variant="outline" onClick={() => setBulkOpen(false)} className="rounded-xl text-xs">
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-center">
                  📦 Bulk Purchase Disabled by Seller
                </div>
              )}
            </div>

            {/* Policies accordion */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <PolicyCard icon="↩️" label="Returns" policy={p.policies?.return} />
              <PolicyCard icon="🔁" label="Replacement" policy={p.policies?.replacement} />
              <PolicyCard icon="💰" label="Refund" policy={p.policies?.refund} />
              <div className="border border-slate-200 rounded-xl p-3.5 flex items-center gap-2.5 bg-white shadow-sm">
                <span className="text-lg">🚚</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Delivery Policy</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                    Ships in {p.dispatchDeliveryDays || 2-3} days
                  </div>
                </div>
              </div>
            </div>

            {/* Pincode Checker panel */}
            <div className="border border-slate-200 rounded-2xl p-4.5 bg-slate-100/70 shadow-sm">
              <div className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-indigo-950" /> Check delivery to your area
              </div>
              <PincodeChecker productId={p._id} />
            </div>
          </div>
        </div>

        {/* Bottom Tabs (Description / Care Instructions / Reviews) */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <Tabs defaultValue="description">
            <TabsList className="flex gap-2 border-b border-slate-200 pb-0 bg-transparent h-auto mb-6">
              <TabsTrigger
                value="description"
                className="px-6 py-3.5 bg-transparent border-none text-slate-400 font-semibold text-sm cursor-pointer border-b-2 border-transparent data-[state=active]:border-indigo-950 data-[state=active]:text-indigo-950"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="care"
                className="px-6 py-3.5 bg-transparent border-none text-slate-400 font-semibold text-sm cursor-pointer border-b-2 border-transparent data-[state=active]:border-indigo-950 data-[state=active]:text-indigo-950"
              >
                Care Instructions
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="px-6 py-3.5 bg-transparent border-none text-slate-400 font-semibold text-sm cursor-pointer border-b-2 border-transparent data-[state=active]:border-indigo-950 data-[state=active]:text-indigo-950"
              >
                Reviews ({p.totalReviews || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="outline-none">
              <div className="max-w-[780px] text-sm text-slate-600 leading-relaxed font-medium">
                {p.description || "No description provided."}
              </div>
            </TabsContent>

            <TabsContent value="care" className="outline-none">
              <div className="max-w-[780px] text-sm text-slate-600 leading-relaxed font-medium">
                {p.careInstructions ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {p.careInstructions.split("\n").filter(Boolean).map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Dry clean or store in clean dry muslin cloth.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="outline-none space-y-6">
              <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                <span className="text-4xl font-extrabold text-indigo-950">
                  {(p.averageRating || 0).toFixed(1)}
                </span>
                <div>
                  <Stars value={p.averageRating || 0} size={16} />
                  <div className="text-xs text-slate-400 mt-1 font-medium">
                    Based on {p.totalReviews || 0} verified buyer reviews
                  </div>
                </div>
              </div>

              {/* Review submit section */}
              {isAuthenticated && eligibility.data?.eligible && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6">
                  <h3 className="text-sm font-bold text-indigo-950 mb-4 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Share your experience
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-1.5">Your rating</div>
                      <Rating value={revRating} onChange={setRevRating} size={22} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Title</label>
                      <Input
                        placeholder="e.g. Stunning dupatta, highly recommended!"
                        value={revTitle}
                        onChange={(e) => setRevTitle(e.target.value)}
                        className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-950"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Your review comment</label>
                      <Textarea
                        placeholder="Tell others what you liked or didn't like about this product..."
                        value={revComment}
                        onChange={(e) => setRevComment(e.target.value)}
                        rows={4}
                        className="rounded-xl border-slate-200 text-sm focus-visible:ring-indigo-950"
                      />
                    </div>
                    <Button
                      onClick={handleReviewSubmit}
                      disabled={revBusy}
                      className="bg-indigo-950 hover:bg-indigo-900 text-white rounded-xl text-xs font-bold px-6"
                    >
                      {revBusy ? <LoadingSpinner className="h-4 w-4" /> : "Submit Review"}
                    </Button>
                  </div>
                </div>
              )}

              {isAuthenticated && eligibility.data?.eligible === false && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 font-semibold mb-6 flex items-center gap-1.5">
                  🛡️ {eligibility.data.message || "Only customers who purchased this product can write a review."}
                </div>
              )}

              {!isAuthenticated && (
                <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4.5 py-3 font-semibold mb-6 flex items-center gap-1.5">
                  🔐 Please sign in to submit a verified buyer review.
                </div>
              )}

              {reviews.length === 0 ? (
                <EmptyState
                  title="No reviews yet"
                  description="Be the first to share your experience."
                  icon={<Star className="h-5 w-5" />}
                />
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="border border-slate-200 rounded-2xl p-4.5 bg-white shadow-sm">
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm border uppercase">
                          {r.user?.firstName?.[0] || r.user?.lastName?.[0] || "?"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-800">
                              {[r.user?.firstName, r.user?.lastName].filter(Boolean).join(" ") || "Verified Buyer"}
                            </span>
                            {r.isVerifiedPurchase && (
                              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                ✓ Verified Buyer
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400 font-medium">
                              · {new Date(r.createdAt).toLocaleDateString("en-IN")}
                            </span>
                          </div>
                          <Stars value={r.rating} size={11} />
                          {r.title && (
                            <div className="font-bold text-xs text-slate-800 mt-2">{r.title}</div>
                          )}
                          <div className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                            {r.comment}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
