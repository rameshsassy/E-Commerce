import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { customerApi } from "@/lib/services";
import { OrderCard } from "@/components/customer/OrderCard";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My orders — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <OrdersPage />
    </ProtectedRoute>
  ),
});

function OrdersPage() {
  const q = useQuery({
    queryKey: ["orders"],
    queryFn: () => customerApi.listOrders(),
  });
  if (q.isLoading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  const orders = q.data || [];
  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {orders.length} order{orders.length !== 1 ? "s" : ""}
      </p>
      <div className="mt-6 space-y-3">
        {orders.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No orders yet"
            description="When you place an order, it will appear here."
            action={
              <Button asChild>
                <Link to="/products">Start shopping</Link>
              </Button>
            }
          />
        ) : (
          orders.map((o) => <OrderCard key={o._id} order={o} />)
        )}
      </div>
    </div>
  );
}
