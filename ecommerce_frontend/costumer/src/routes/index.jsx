import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { productApi, publicApi } from "@/lib/services";
import { ProductCard } from "@/components/customer/ProductCard";
import { SkeletonGrid } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight
} from "lucide-react";
import { HeroBanner } from "@/components/home/HeroBanner";
import { FeaturedProductsSection } from "@/components/customer/FeaturedProductsSection";

const defaultSettings = {
  heroBanner: {
    enabled: true,
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80",
    headlineEnabled: true,
    headline: "Authentic. Ethical. Empowering.",
    headlineAlignment: "center",
    subtitleEnabled: true,
    subtitle: "Crafted with Purpose, Delivered with Heart ❤️",
    ctaEnabled: true,
    ctaText: "SHOP NOW",
    ctaLink: "/products",
    ctaColor: "#ffd401",
  },
};



export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aashansh — Premium Hyperlocal Marketplace" },
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
  const products = useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => productApi.list({ limit: 8 }),
  });
  const settings = useQuery({
    queryKey: ["homepageSettings"],
    queryFn: () => publicApi.getHomepageSettings(),
  });

  const productList = Array.isArray(products.data)
    ? products.data
    : products.data?.products || [];

  const displaySettings = settings.data || defaultSettings;
  const displayHeroConfig = displaySettings.heroBanner;

  return (
    <>
      {/* Hero section loads instantly using settings configuration or fallback */}
      <HeroBanner config={displayHeroConfig} />

      {/* Featured Products */}
      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Available products</h2>
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

      {/* Featured Products Layout Lists */}
      <FeaturedProductsSection />
    </>
  );
}
