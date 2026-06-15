import { Link, useNavigate } from "@tanstack/react-router";
import {
  User,
  Package,
  MapPin,
  Headphones,
  MessageCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountMenu({ config }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  if (!config || !config.enabled) return null;

  const handleSignOut = async () => {
    try {
      await logout();
      navigate({ to: "/" });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center">
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1.5 h-10 px-3 rounded-full hover:bg-muted/80 transition-colors"
              aria-label="Account Menu"
            >
              <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                {user?.firstName ? user.firstName[0].toUpperCase() : "U"}
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl border border-border bg-popover/90 backdrop-blur-md shadow-elegant z-[100]">
            <DropdownMenuLabel className="px-3 py-2 font-normal">
              <div className="text-sm font-semibold truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {user?.email}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <User className="h-4 w-4 text-muted-foreground" />
                Profile
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <Package className="h-4 w-4 text-muted-foreground" />
                Orders
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/addresses" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Addresses
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/returns" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <Package className="h-4 w-4 text-muted-foreground" />
                Returns
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/support" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <Headphones className="h-4 w-4 text-muted-foreground" />
                Support
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link to="/chat" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent cursor-pointer transition-colors">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Live Chat
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-destructive/10 text-destructive cursor-pointer transition-colors focus:bg-destructive/10 focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost" className="rounded-full font-semibold px-4 hover:bg-muted text-sm">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full font-semibold px-4 text-sm bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/auth" search={{ tab: "register" }}>Sign up</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
