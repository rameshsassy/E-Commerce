import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/customer/ProtectedRoute";
import { returnApi } from "@/lib/services";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, LoadingSpinner } from "@/components/customer/EmptyState";
import { Package } from "lucide-react";

export const Route = createFileRoute("/returns")({
  head: () => ({ meta: [{ title: "My returns — Aashansh" }] }),
  component: () => (
    <ProtectedRoute>
      <ReturnsPage />
    </ProtectedRoute>
  ),
});

function ReturnsPage() {
  const q = useQuery({
    queryKey: ["returns"],
    queryFn: () => returnApi.list(),
  });
  if (q.isLoading)
    return (
      <div className="container-page py-16 text-center">
        <LoadingSpinner className="text-primary" />
      </div>
    );
  const list = q.data || [];
  return (
    <div className="container-page py-8">
      <h1 className="text-3xl font-bold">Returns & refunds</h1>
      <div className="mt-6 space-y-3">
        {list.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No return requests"
            description="You can request a return from a delivered order."
          />
        ) : (
          list.map((r) => (
            <Card key={r._id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {r.product?.name || "Product"}
                    </span>
                    <Badge variant="secondary">{r.type}</Badge>
                    <Badge>{r.status || "pending"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.reason}
                    {r.message ? ` — ${r.message}` : ""}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {r.createdAt && new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
