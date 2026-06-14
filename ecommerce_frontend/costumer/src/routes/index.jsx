import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoryApi, productApi } from "@/lib/services";
import { ProductCard } from "@/components/customer/ProductCard";
import { SkeletonGrid } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Truck, ShieldCheck, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aashansh — Shop the best of your neighborhood" },
      {
        name: "description",
        content:
          "Handpicked products from local sellers, delivered fast to your doorstep.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { isAuthenticated } = useAuth();
  const products = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productApi.list({ limit: 8 }),
  });
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
  });

  const productList = Array.isArray(products.data)
    ? products.data
    : products.data?.products || [];
  const categoryList = (cats.data || []).slice(0, 8);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.94_0.05_75)_0%,_transparent_60%)]" />
        <div className="container-page grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-medium shadow-card">
              <Sparkles className="h-3 w-3 text-primary" /> Premium hyperlocal
              marketplace
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              The best of your{" "}
              <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                neighborhood
              </span>
              , delivered.
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg">
              Discover handpicked products from trusted local sellers — fast
              delivery, fair prices, and people you can count on.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/products">
                  Shop now <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">Create account</Link>
                </Button>
              )}
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-4">
              <Feature
                icon={<Truck className="h-4 w-4" />}
                label="Fast delivery"
              />
              <Feature
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Secure payments"
              />
              <Feature
                icon={<Heart className="h-4 w-4" />}
                label="Loved locally"
              />
            </div>
          </div>
          <div className="relative aspect-square w-full max-w-md justify-self-center md:max-w-none">
            <div className="absolute inset-0 rounded-[3rem] gradient-primary opacity-90 shadow-elegant" />
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&q=80"
              alt="Shopping"
              className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] rounded-[2.5rem] object-cover"
            />
          </div>
        </div>
      </section>

      {categoryList.length > 0 && (
        <section className="container-page py-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-bold">Shop by category</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categoryList.map((c) => (
              <Link
                key={c._id}
                to="/products"
                search={{ category: c._id }}
                className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center shadow-card transition hover:-translate-y-0.5 hover:shadow-elegant"
              >
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-full bg-accent">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold">{c.name[0]}</span>
                  )}
                </div>
                <span className="line-clamp-2 text-xs font-medium">
                  {c.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured products</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/products">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {products.isLoading ? (
          <SkeletonGrid />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productList.slice(0, 8).map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
        {!products.isLoading && productList.length === 0 && (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            No products available yet. Check your backend at{" "}
            <code>
              {import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"}
            </code>
          </div>
        )}
      </section>
    </>
  );
}

function Feature({ icon, label }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center text-xs text-muted-foreground">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-background shadow-card text-foreground">
        {icon}
      </span>
      {label}
    </div>
  );
}
