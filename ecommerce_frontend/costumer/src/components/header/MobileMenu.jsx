import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Menu,
  ChevronRight,
  User,
  Package,
  MapPin,
  Headphones,
  MessageCircle,
  LogOut,
  Sparkles,
  Search,
  Gift,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";

export function MobileMenu({ config, categories = [] }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const handleSignOut = async () => {
    try {
      await logout();
      setOpen(false);
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMobileSearch = (e) => {
    e.preventDefault();
    if (q.trim()) {
      setOpen(false);
      navigate({ to: "/products", search: { search: q.trim() } });
      setQ("");
    }
  };

  const activeCats = categories.filter((c) => c.isActive);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-10 w-10 hover:bg-muted/80 rounded-full transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] max-w-sm p-0 flex flex-col h-full bg-background border-r border-border">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border text-left">
          <SheetTitle className="font-display font-extrabold text-xl tracking-tight text-primary uppercase">
            Aashansh Menu
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Mobile Search */}
          {config?.searchBar?.enabled && (
            <form onSubmit={handleMobileSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={config.searchBar.placeholder || "Search..."}
                className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/10 transition-all text-sm"
              />
            </form>
          )}

          {/* Navigation Categories */}
          {activeCats.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                Categories
              </h3>
              <div className="flex flex-col gap-1">
                {activeCats.map((cat) => (
                  <SheetClose asChild key={cat._id}>
                    <Link
                      to="/products"
                      search={{ category: cat.slug }}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-muted text-sm font-semibold transition-colors"
                    >
                      <span className="text-foreground">{cat.name}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
          )}

          {/* Bulk Purchase Button */}
          {config?.bulkPurchase?.enabled && (
            <div className="space-y-2.5">
              <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                B2B Services
              </h3>
              <SheetClose asChild>
                <Link
                  to={config.bulkPurchase.link || "/bulk-purchase"}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#ffd401]/15 text-[#0f172a] border border-[#ffd401]/40 hover:bg-[#ffd401]/25 text-sm font-bold transition-all"
                >
                  <Sparkles className="h-4 w-4 fill-[#b8960a] stroke-[#b8960a]" />
                  {config.bulkPurchase.text || "Bulk Purchase"}
                </Link>
              </SheetClose>
            </div>
          )}

          {/* User Account / Navigation */}
          <div className="space-y-2.5">
            <h3 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
              Account settings
            </h3>
            <div className="flex flex-col gap-1">
              {isAuthenticated ? (
                <>
                  <SheetClose asChild>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <User className="h-4.5 w-4.5 text-muted-foreground" />
                      Profile
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/orders"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <Package className="h-4.5 w-4.5 text-muted-foreground" />
                      Orders
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/addresses"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <MapPin className="h-4.5 w-4.5 text-muted-foreground" />
                      Addresses
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/returns"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <Package className="h-4.5 w-4.5 text-muted-foreground" />
                      Returns
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/support"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <Headphones className="h-4.5 w-4.5 text-muted-foreground" />
                      Support
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/chat"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-sm font-semibold text-foreground transition-colors animate-fade-in"
                    >
                      <MessageCircle className="h-4.5 w-4.5 text-muted-foreground" />
                      Live Chat
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/rewards"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-500/10 text-sm font-semibold transition-colors animate-fade-in"
                      style={{ color: '#fbbf24' }}
                    >
                      <Gift className="h-4.5 w-4.5" style={{ color: '#fbbf24' }} />
                      My Rewards
                    </Link>
                  </SheetClose>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive text-sm font-semibold transition-colors w-full text-left"
                  >
                    <LogOut className="h-4.5 w-4.5" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 p-1">
                  <SheetClose asChild>
                    <Link
                      to="/auth"
                      className="flex items-center justify-center p-2.5 rounded-xl border border-border hover:bg-muted text-sm font-bold transition-all text-center"
                    >
                      Sign In
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      to="/auth"
                      search={{ tab: "register" }}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-sm font-bold transition-all text-center"
                    >
                      Sign Up
                    </Link>
                  </SheetClose>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Area */}
        {isAuthenticated && user && (
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {user.firstName ? user.firstName[0].toUpperCase() : "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
