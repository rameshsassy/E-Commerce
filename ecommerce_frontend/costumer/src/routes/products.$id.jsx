import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productApi, reviewApi, customerApi } from "@/lib/services";
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
} from "@/components/ui/dialog";
import { Rating, ReviewCard } from "@/components/customer/ReviewCard";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn, getImageUrl } from "@/lib/utils";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { add } = useCart();
  const { toggle, has } = useWishlist();

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: () => productApi.get(id),
  });
  const reviewsQ = useQuery({
    queryKey: ["reviews", id],
    queryFn: () => reviewApi.list(id),
  });
  const orders = useQuery({
    queryKey: ["my-orders-for-review"],
    queryFn: () => customerApi.listOrders().catch(() => []),
    enabled: isAuthenticated,
  });

  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState(null);
  const [pinBusy, setPinBusy] = useState(false);

  const p = product.data;
  const FALLBACK_IMG = "https://placehold.co/800x800/f3f4f6/94a3b8?text=No+Image";
  const reviews = Array.isArray(reviewsQ.data)
    ? reviewsQ.data
    : reviewsQ.data?.reviews || [];

  // Can review only if user has delivered this product in any order
  const canReview = (orders.data || []).some(
    (o) =>
      o.status === "delivered" &&
      o.items?.some((it) => (it.product?._id || it.product) === id),
  );

  if (product.isLoading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  if (!p)
    return (
      <div className="container-page py-16">
        <EmptyState title="Product not found" />
      </div>
    );

  const min = p.minOrderQuantity || 1;
  const max = p.maxOrderQuantity || 99;
  const wished = has(p._id);
  const hasDiscount = p.mrp && p.mrp > p.price;
  const sellerName =
    typeof p.seller === "object" ? p.seller.storeName || p.seller.name : "";
  const catName = typeof p.category === "object" ? p.category.name : "";

  const checkPin = async () => {
    if (!pincode) return;
    setPinBusy(true);
    setPinResult(null);
    try {
      setPinResult(await productApi.checkPincode(id, pincode));
    } catch (e) {
      setPinResult({ deliverable: false, message: e.message });
    } finally {
      setPinBusy(false);
    }
  };

  const addToCart = async () => {
    if (!isAuthenticated) return toast.error("Please sign in");
    try {
      await add(p._id, qty);
      toast.success("Added to cart");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const images = Array.isArray(p.images) && p.images.length > 0 ? p.images : [];
  const totalImages = images.length;
  const hasPrev = imgIdx > 0;
  const hasNext = imgIdx < totalImages - 1;

  return (
    <div className="container-page py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {/* ── Main image with arrow navigation ── */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border bg-muted group">
            <img
              src={getImageUrl(images[imgIdx]) || FALLBACK_IMG}
              alt={p.title || p.name}
              className="h-full w-full object-cover transition-opacity duration-200"
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_IMG) {
                  e.currentTarget.src = FALLBACK_IMG;
                }
              }}
            />

            {/* Image counter badge: 1/5 */}
            {totalImages > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                {imgIdx + 1}/{totalImages}
              </span>
            )}

            {/* Left arrow */}
            {totalImages > 1 && (
              <button
                aria-label="Previous image"
                onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
                disabled={!hasPrev}
                className={cn(
                  "absolute left-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-md backdrop-blur transition hover:scale-110",
                  !hasPrev ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Right arrow */}
            {totalImages > 1 && (
              <button
                aria-label="Next image"
                onClick={() => setImgIdx((i) => Math.min(totalImages - 1, i + 1))}
                disabled={!hasNext}
                className={cn(
                  "absolute right-2 top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-background/90 shadow-md backdrop-blur transition hover:scale-110",
                  !hasNext ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100",
                )}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* ── Thumbnail strip ── */}
          {totalImages > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {images.map((src, i) => (
                <button
                  key={i}
                  aria-label={`View image ${i + 1}`}
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-150",
                    i === imgIdx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent opacity-70 hover:opacity-100 hover:border-muted-foreground/50",
                  )}
                >
                  <img
                    src={getImageUrl(src) || FALLBACK_IMG}
                    alt={`Product image ${i + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_IMG) {
                        e.currentTarget.src = FALLBACK_IMG;
                      }
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {catName && (
            <Badge variant="secondary" className="mb-2">
              {catName}
            </Badge>
          )}
          <h1 className="text-3xl font-bold tracking-tight">{p.title || p.name}</h1>
          {sellerName && (
            <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <Store className="h-3 w-3" /> Sold by{" "}
              <span className="font-medium text-foreground">{sellerName}</span>
            </div>
          )}
          {typeof p.averageRating === "number" && p.averageRating > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <Rating value={Math.round(p.averageRating)} />
              <span className="text-sm font-medium">
                {p.averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({p.totalReviews || 0} reviews)
              </span>
            </div>
          )}

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold">
              ₹{p.price?.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  ₹{p.mrp?.toLocaleString("en-IN")}
                </span>
                <Badge className="bg-success/15 text-success">
                  {Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off
                </Badge>
              </>
            )}
          </div>

          {p.description && (
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {p.description}
            </p>
          )}

          <div className="mt-6 space-y-3">
            <div>
              <div className="mb-2 text-sm font-medium">Quantity</div>
              <div className="inline-flex items-center rounded-full border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQty(Math.max(min, qty - 1))}
                  disabled={qty <= min}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="min-w-10 text-center font-medium">{qty}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQty(Math.min(max, qty + 1))}
                  disabled={qty >= max}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.stock ? `${p.stock} in stock` : "In stock"} • Min {min}, Max{" "}
                {max}
              </p>
            </div>

            <div className="rounded-xl border p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4" /> Check delivery
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="max-w-[12rem]"
                />
                <Button variant="outline" onClick={checkPin} disabled={pinBusy}>
                  {pinBusy ? <LoadingSpinner /> : "Check"}
                </Button>
              </div>
              {pinResult && (
                <p
                  className={cn(
                    "mt-2 text-sm",
                    pinResult.deliverable ? "text-success" : "text-destructive",
                  )}
                >
                  {pinResult.deliverable ? (
                    <>
                      <Truck className="mr-1 inline h-4 w-4" />
                      Delivery available {pinResult.eta && `• ${pinResult.eta}`}
                    </>
                  ) : (
                    pinResult.message || "Not deliverable to this pincode"
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button size="lg" className="flex-1" onClick={addToCart}>
              <ShoppingBag className="mr-1 h-4 w-4" /> Add to cart
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                if (!isAuthenticated) return toast.error("Sign in first");
                toggle(p._id);
              }}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  wished && "fill-destructive text-destructive",
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="reviews" className="mt-12">
        <TabsList>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="reviews" className="mt-4">
          {canReview && (
            <ReviewForm
              productId={p._id}
              onCreated={() =>
                qc.invalidateQueries({ queryKey: ["reviews", id] })
              }
            />
          )}
          {reviewsQ.isLoading ? (
            <LoadingSpinner />
          ) : reviews.length === 0 ? (
            <EmptyState
              title="No reviews yet"
              description="Be the first to share your experience."
              icon={<Star className="h-5 w-5" />}
            />
          ) : (
            <div>
              {reviews.map((r) => (
                <ReviewCard
                  key={r._id}
                  review={r}
                  onToggleHelpful={async () => {
                    if (!isAuthenticated) return toast.error("Sign in to vote");
                    try {
                      await reviewApi.toggleHelpful(id, r._id);
                      qc.invalidateQueries({ queryKey: ["reviews", id] });
                    } catch (e) {
                      toast.error(e.message);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent
          value="details"
          className="mt-4 prose prose-sm max-w-none text-muted-foreground"
        >
          <p>{p.description || "No additional details available."}</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReviewForm({ productId, onCreated }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [open, setOpen] = useState(false);
  const m = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append("rating", String(rating));
      fd.append("text", text);
      files.slice(0, 3).forEach((f) => fd.append("images", f));
      return reviewApi.create(productId, fd);
    },
    onSuccess: () => {
      toast.success("Review submitted");
      setText("");
      setFiles([]);
      setOpen(false);
      onCreated();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">Write a review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your experience</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-sm font-medium">Your rating</div>
            <Rating value={rating} onChange={setRating} size={22} />
          </div>
          <Textarea
            placeholder="Tell others what you liked or didn't like…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted/40">
            <Upload className="h-4 w-4" /> Add up to 3 photos
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) =>
                setFiles(Array.from(e.target.files || []).slice(0, 3))
              }
            />
          </label>
          {files.length > 0 && (
            <div className="flex gap-2">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ))}
            </div>
          )}
          <Button
            className="w-full"
            disabled={m.isPending}
            onClick={() => m.mutate()}
          >
            {m.isPending ? <LoadingSpinner /> : "Submit review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
