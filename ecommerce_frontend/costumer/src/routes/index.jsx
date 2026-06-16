import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoryApi, productApi, publicApi } from "@/lib/services";
import { ProductCard } from "@/components/customer/ProductCard";
import { SkeletonGrid } from "@/components/customer/EmptyState";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Shirt, 
  Sparkles, 
  Flower2, 
  Monitor, 
  Soup, 
  Cpu, 
  ShoppingBasket, 
  BookOpen, 
  Truck, 
  ShieldCheck, 
  Award, 
  Heart 
} from "lucide-react";
import { HeroBanner } from "@/components/home/HeroBanner";

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

const defaultHomeCategories = [
  { _id: "fashion-id", name: "Fashion", slug: "fashion" },
  { _id: "beauty-id", name: "Beauty & Personal Care", slug: "beauty-personal-care" },
  { _id: "health-id", name: "Health & Wellness", slug: "health-wellness" },
  { _id: "electronics-id", name: "Electronics", slug: "electronics" },
  { _id: "home-kitchen-id", name: "Home & Kitchen", slug: "home-kitchen" },
  { _id: "home-appliances-id", name: "Home Appliances", slug: "home-appliances" },
  { _id: "grocery-id", name: "Grocery & Gourmet", slug: "grocery-gourmet" },
  { _id: "books-id", name: "Books & Stationery", slug: "books-stationery" },
];

const categoryIconMap = {
  "fashion": <Shirt className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "beauty-personal-care": <Sparkles className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "health-wellness": <Flower2 className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "electronics": <Monitor className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "home-kitchen": <Soup className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "home-appliances": <Cpu className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "grocery-gourmet": <ShoppingBasket className="h-6 w-6 stroke-[1.5] text-slate-800" />,
  "books-stationery": <BookOpen className="h-6 w-6 stroke-[1.5] text-slate-800" />,
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
  const cats = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryApi.list(),
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

  const categoryList = defaultHomeCategories.map((defCat) => {
    const dbCat = (cats.data || []).find((c) => c.slug === defCat.slug);
    return {
      _id: dbCat?._id || defCat._id,
      name: dbCat?.name || defCat.name,
      slug: defCat.slug,
    };
  });

  return (
    <>
      {/* Hero section loads instantly using settings configuration or fallback */}
      <HeroBanner config={displayHeroConfig} />

      {/* Category listing with horizontal scroll on mobile */}
      <section className="container-page py-10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Shop by category</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none sm:grid sm:grid-cols-4 lg:grid-cols-8 sm:overflow-visible sm:pb-0">
          {categoryList.map((c) => (
            <Link
              key={c._id}
              to="/products"
              search={{ category: c._id }}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all shrink-0 w-[115px] sm:w-auto sm:shrink sm:min-w-0 cursor-pointer"
            >
              <div className="grid h-14 w-14 place-items-center rounded-full bg-[#fef9c3] border border-yellow-200/50 shadow-inner group-hover:scale-105 transition-transform">
                {categoryIconMap[c.slug] || <Sparkles className="h-6 w-6 text-slate-800" />}
              </div>
              <span className="text-[11px] font-bold text-slate-900 leading-snug line-clamp-2">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Bottom Features Bar inside a beige container */}
      <section className="container-page py-6">
        <div className="rounded-3xl bg-[#faf8f5] p-6 md:p-8 border border-amber-100/30">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <FeatureItem
              icon={<Truck className="h-5 w-5 text-slate-800" />}
              title="Fast delivery"
              subtitle="Quick & reliable delivery"
            />
            <FeatureItem
              icon={<ShieldCheck className="h-5 w-5 text-slate-800" />}
              title="Secure payments"
              subtitle="100% secure transactions"
            />
            <FeatureItem
              icon={<Award className="h-5 w-5 text-slate-800" />}
              title="Quality assured"
              subtitle="Handpicked for you"
            />
            <FeatureItem
              icon={<Heart className="h-5 w-5 text-slate-800" />}
              title="Loved locally"
              subtitle="Supporting local businesses"
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="container-page py-10">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured products</h2>
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

function FeatureItem({ icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#fef9c3] border border-yellow-200/50 shadow-sm">
        {icon}
      </div>
      <div className="min-w-0">
        <h4 className="text-xs md:text-sm font-bold text-slate-900 truncate">
          {title}
        </h4>
        <p className="text-[10px] md:text-xs text-slate-500 truncate mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
