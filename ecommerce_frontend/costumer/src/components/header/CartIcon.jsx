import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";

export function CartIcon({ config }) {
  const { count } = useCart();

  if (!config || !config.enabled) return null;

  return (
    <Button asChild variant="ghost" size="icon" className="relative hover:bg-muted/80 rounded-full transition-colors h-10 w-10">
      <Link to="/cart" aria-label="Cart">
        <ShoppingBag className="h-5 w-5 text-foreground" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-primary-foreground border-2 border-background animate-pulse-slow">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
