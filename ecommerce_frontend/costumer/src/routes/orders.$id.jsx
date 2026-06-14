import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { customerApi, returnApi } from "@/lib/services";
import { LoadingSpinner, EmptyState } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/orders/$id")({
  component: () => (
    <ProtectedRoute>
      <OrderDetail />
    </ProtectedRoute>
  ),
});

function OrderDetail() {
  const { id } = Route.useParams();
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: () => customerApi.getOrder(id),
  });
  if (q.isLoading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  const o = q.data;
  if (!o)
    return (
      <div className="container-page py-12">
        <EmptyState title="Order not found" />
      </div>
    );

  const delivered = (s) => s?.toLowerCase() === "delivered";

  return (
    <div className="container-page py-8">
      <Link
        to="/orders"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">
            Order #{o.orderId || o._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-muted-foreground">
            Placed {new Date(o.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{o.status || "pending"}</Badge>
          {o.paymentStatus && (
            <Badge variant="outline">{o.paymentStatus}</Badge>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 font-semibold">Items</h2>
            <div className="space-y-3">
              {(o.shipments?.length ? o.shipments : [{ items: o.items }]).map(
                (sh, idx) => (
                  <div key={idx} className="rounded-lg border p-3">
                    {sh.seller && (
                      <div className="mb-2 text-xs text-muted-foreground">
                        Seller:{" "}
                        <span className="font-medium text-foreground">
                          {sh.seller.storeName || sh.seller.name}
                        </span>{" "}
                        {sh.status && (
                          <Badge variant="outline" className="ml-1">
                            {sh.status}
                          </Badge>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      {(sh.items || []).map((it, i) => {
                        const p = it.product || {};
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <img
                              src={
                                p.images?.[0] ||
                                "https://placehold.co/80x80/png"
                              }
                              className="h-14 w-14 rounded-md object-cover"
                              alt=""
                            />
                            <div className="min-w-0 flex-1">
                              <div className="line-clamp-1 text-sm font-medium">
                                {p.name || "Product"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Qty {it.quantity} • ₹
                                {(it.price || p.price || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                            </div>
                            {delivered(sh.status || o.status || "") && (
                              <ReturnDialog
                                orderId={o._id}
                                shipmentId={sh._id}
                                productId={p._id}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>
          </Card>
        </div>
        <aside className="space-y-4">
          {o.shippingAddress && (
            <Card className="p-4">
              <h3 className="mb-2 text-sm font-semibold">Delivery address</h3>
              <p className="text-sm text-muted-foreground">
                {o.shippingAddress.fullName}
                <br />
                {o.shippingAddress.line1}, {o.shippingAddress.city},{" "}
                {o.shippingAddress.state} {o.shippingAddress.pincode}
              </p>
            </Card>
          )}
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-semibold">Payment</h3>
            <div className="flex justify-between text-sm">
              <span>Method</span>
              <span>{o.paymentMethod || "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Status</span>
              <span>{o.paymentStatus || "—"}</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
              <span>Total</span>
              <span>₹{(o.totalAmount || 0).toLocaleString("en-IN")}</span>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ReturnDialog({ orderId, shipmentId, productId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("refund");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Return
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request return</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="refund">Refund</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="damaged">Item damaged</SelectItem>
                <SelectItem value="wrong">Wrong item received</SelectItem>
                <SelectItem value="quality">Quality issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Tell us more (optional)"
            />
          </div>
          <Button
            className="w-full"
            disabled={!reason || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await returnApi.create({
                  orderId,
                  shipmentId,
                  productId,
                  type,
                  reason,
                  message,
                });
                toast.success("Return request submitted");
                setOpen(false);
              } catch (e) {
                toast.error(e.message);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? <LoadingSpinner /> : "Submit request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
