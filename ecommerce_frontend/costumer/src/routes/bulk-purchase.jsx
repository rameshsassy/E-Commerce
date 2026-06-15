import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { productApi } from "@/lib/services";
import { ProductCard } from "@/components/customer/ProductCard";
import { EmptyState, SkeletonGrid } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export const Route = createFileRoute("/bulk-purchase")({
  validateSearch: (s) => ({
    page: s.page ? Number(s.page) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Bulk Purchase & B2B Solutions — Aashansh" },
      { name: "description", content: "Explore products available for bulk ordering." },
    ],
  }),
  component: BulkPurchasePage,
});

function BulkPurchasePage() {
  const search = useSearch({ from: "/bulk-purchase" });
  const navigate = useNavigate({ from: "/bulk-purchase" });

  const products = useQuery({
    queryKey: ["bulkProducts", search.page],
    queryFn: () => productApi.list({ bulkPurchaseEnabled: "true", page: search.page, limit: 16 }),
  });

  const { list, total, pages } = useMemo(() => {
    const d = products.data;
    if (Array.isArray(d)) return { list: d, total: d.length, pages: 1 };
    return {
      list: d?.products || [],
      total: d?.total || 0,
      pages: d?.pages || 1,
    };
  }, [products.data]);

  const setPage = (pageNumber) => {
    navigate({ search: { page: pageNumber } });
  };

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <Sparkles className="h-6 w-6 text-primary fill-current" />
            Bulk Purchase
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Explore items available for commercial, retail, or custom volume ordering.
          </p>
        </div>
        <div className="text-sm text-muted-foreground font-medium bg-muted px-4 py-2 rounded-xl border">
          {products.isLoading ? "Loading products..." : `${total} items matching bulk status`}
        </div>
      </div>

      {products.isLoading ? (
        <SkeletonGrid count={8} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No bulk products available"
          description="Try exploring our standard product catalog or contact support for inquiry assistance."
          action={
            <Button asChild>
              <Link to="/products">Browse all products</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
          
          {pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={search.page <= 1}
                onClick={() => setPage(search.page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground">
                Page {search.page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={search.page >= pages}
                onClick={() => setPage(search.page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
