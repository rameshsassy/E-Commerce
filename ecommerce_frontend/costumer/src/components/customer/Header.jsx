import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Heart,
  ShoppingBag,
  User,
  Search,
  Bell,
  Menu as MenuIcon,
  LogOut,
  Package,
  MapPin,
  Headphones,
  MessageCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { notificationApi } from "@/lib/services";

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const { items: wishlist } = useWishlist();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const notif = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationApi.list(),
    enabled: isAuthenticated,
    refetchInterval: 60000,
  });
  const unread = (notif.data || []).filter((n) => !n.read).length;

  const submitSearch = (e) => {
    e.preventDefault();
    navigate({ to: "/products", search: { search: q || undefined } });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container-page flex h-16 items-center gap-4">
        <Link
          to="/"
          className="shrink-0 flex items-center gap-2 sm:gap-3 min-w-0"
        >
          <img
            src="/brand/aashansh-logo.png"
            alt="Aashansh"
            className="h-8 sm:h-10 w-auto object-contain"
          />
        </Link>

        <form
          onSubmit={submitSearch}
          className="relative hidden flex-1 max-w-xl md:block"
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands, categories…"
            className="h-10 pl-9 rounded-full bg-muted/60 border-transparent focus-visible:bg-background"
          />
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden md:inline-flex"
          >
            <Link to="/products">Shop</Link>
          </Button>

          {isAuthenticated && (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link to="/notifications" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
          )}

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {wishlist.length}
                </span>
              )}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="relative">
            <Link to="/cart" aria-label="Cart">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">
                    <Package className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/addresses">
                    <MapPin className="mr-2 h-4 w-4" />
                    Addresses
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/returns">
                    <Package className="mr-2 h-4 w-4" />
                    Returns
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/support">
                    <Headphones className="mr-2 h-4 w-4" />
                    Support
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/chat">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Live chat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout().then(() => navigate({ to: "/" }));
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </Button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container-page py-3">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-10 pl-9 rounded-full bg-muted/60"
              />
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
