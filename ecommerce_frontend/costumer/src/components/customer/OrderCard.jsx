import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Package } from "lucide-react";

const statusColor = {
  pending: "bg-warning/15 text-warning-foreground",
  confirmed: "bg-primary/15 text-primary",
  shipped: "bg-accent/40 text-accent-foreground",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

export function OrderCard({ order }) {
  const total = order.totalAmount ?? 0;
  const status = (order.status || "pending").toLowerCase();
  return (
    <Link to="/orders/$id" params={{ id: order._id }}>
      <Card className="flex flex-wrap items-center gap-4 p-4 transition hover:bg-muted/40">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-accent">
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              #{order.orderId || order._id.slice(-8).toUpperCase()}
            </span>
            <Badge className={statusColor[status] || "bg-muted"}>
              {status}
            </Badge>
            {order.paymentStatus && (
              <Badge variant="outline">{order.paymentStatus}</Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            • {order.items?.length || 0} item
            {(order.items?.length || 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold">₹{total.toLocaleString("en-IN")}</div>
          <p className="text-xs text-muted-foreground">
            {order.paymentMethod || "—"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
