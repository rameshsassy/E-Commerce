import {
  createFileRoute,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { productApi, categoryApi } from "@/lib/services";
import { ProductCard } from "@/components/customer/ProductCard";
import { EmptyState, SkeletonGrid } from "@/components/customer/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/products")({
  validateSearch: (s) => ({
    search: s.search || undefined,
    category: s.category || undefined,
    sort: s.sort || undefined,
    page: s.page ? Number(s.page) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Shop products — Aashansh" },
      { name: "description", content: "Browse our full product catalog." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const search = useSearch({ from: "/products" });
  const navigate = useNavigate({ from: "/products" });
  const [localSearch, setLocalSearch] = useState(search.search || "");

  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
  });
  const products = useQuery({
    queryKey: ["products", search],
    queryFn: () => productApi.list({ ...search, limit: 16 }),
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

  const setSearch = (patch) =>
    navigate({ search: (p) => ({ ...p, ...patch, page: patch.page ?? 1 }) });

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {products.isLoading ? "Loading…" : `${total} results`}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch({ search: localSearch || undefined });
          }}
          className="relative min-w-[16rem] flex-1"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search products"
            className="pl-9"
          />
        </form>
        <Select
          value={search.category || "all"}
          onValueChange={(v) =>
            setSearch({ category: v === "all" ? undefined : v })
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {(cats.data || []).map((c) => (
              <SelectItem key={c._id} value={c._id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={search.sort || "newest"}
          onValueChange={(v) =>
            setSearch({ sort: v === "newest" ? undefined : v })
          }
        >
          <SelectTrigger className="w-44">
            <SlidersHorizontal className="mr-1 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: low to high</SelectItem>
            <SelectItem value="price_desc">Price: high to low</SelectItem>
            <SelectItem value="rating">Highest rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {products.isLoading ? (
        <SkeletonGrid count={12} />
      ) : list.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try adjusting your filters or search terms."
          action={
            <Button onClick={() => navigate({ search: {} })}>
              Reset filters
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
                onClick={() => setSearch({ page: search.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {search.page} of {pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={search.page >= pages}
                onClick={() => setSearch({ page: search.page + 1 })}
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
