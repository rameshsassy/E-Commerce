import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Link,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { MessageCircle } from "lucide-react";

import appCss from "../styles.css?url";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { Header } from "@/components/header/Header";
import { Footer } from "@/components/customer/Footer";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { publicApi } from "@/lib/services";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Aashansh — Premium Hyperlocal Marketplace" },
      {
        name: "description",
        content:
          "Discover handpicked products from the best local sellers, delivered to your doorstep.",
      },
      { property: "og:title", content: "Aashansh" },
      {
        property: "og:description",
        content: "Premium hyperlocal marketplace.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap",
      },
    ],
    scripts: [
      { src: "https://checkout.razorpay.com/v1/checkout.js", defer: true },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const defaultAnnouncementConfig = {
  enabled: true,
  scrolling: true,
  text: "conscious, inclusive, and impactful consumption",
  backgroundColor: "#ffd401",
  textColor: "#000000",
};

function RootLayout() {
  const { user } = useAuth();
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  const { data: settings, isLoading, isFetching } = useQuery({
    queryKey: ["homepageSettings"],
    queryFn: () => publicApi.getHomepageSettings(),
  });

  const handleReturnToAdmin = () => {
    if (typeof window !== "undefined") {
      const adminToken = localStorage.getItem("adminToken");
      localStorage.removeItem("token");
      localStorage.removeItem("adminToken");

      const getAdminPortalUrl = () => {
        const envUrl = import.meta.env.VITE_ADMIN_PORTAL_URL;
        if (envUrl) return envUrl.replace(/\/$/, "");

        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        if (hostname === "localhost" || hostname === "127.0.0.1") {
          return `${protocol}//${hostname}:5175`;
        }
        
        if (hostname.includes("aashansh.org")) {
          return `${protocol}//superadmin.aashansh.org`;
        }
        
        if (hostname.endsWith(".vercel.app")) {
          const newHost = hostname.replace("-customer", "-admin").replace("-seller", "-admin");
          return `${protocol}//${newHost}`;
        }

        return `${protocol}//${hostname}:${window.location.port}`;
      };

      const adminPortalUrl = getAdminPortalUrl();
      window.location.href = `${adminPortalUrl}/login?token=${adminToken}`;
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {adminToken && user && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold shadow-lg z-[9999] relative border-b border-amber-400">
          <div className="flex items-center gap-3">
            <span className="bg-slate-950 text-amber-400 px-2.5 py-1 rounded-md text-xs uppercase font-extrabold tracking-wider shadow-inner">
              Impersonating
            </span>
            <span className="text-slate-950">
              You are managing <strong>{user.firstName} {user.lastName}</strong> (Customer ID: <span className="font-mono font-bold">{user.customerId}</span>) as Super Admin.
            </span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="bg-slate-950 text-white hover:bg-slate-900 px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5"
          >
            Return to Super Admin
          </button>
        </div>
      )}
      {isLoading || isFetching ? (
        <div className="h-9 w-full bg-muted animate-pulse" />
      ) : (
        <AnnouncementBar config={settings?.announcementBar || defaultAnnouncementConfig} />
      )}
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {/* Floating support button */}
      <Link
        to="/chat"
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 group border border-primary/20 cursor-pointer overflow-visible"
        title="Chat with Support"
      >
        <span className="absolute -inset-0.5 animate-ping rounded-full bg-primary/40 opacity-75 group-hover:bg-primary/50 duration-1000 pointer-events-none" />
        <MessageCircle className="h-6 w-6 relative z-10" />
      </Link>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <RootLayout />
            <Toaster richColors position="top-right" />
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
