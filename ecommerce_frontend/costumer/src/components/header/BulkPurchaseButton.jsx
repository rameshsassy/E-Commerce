import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function BulkPurchaseButton({ config }) {
  if (!config || !config.enabled) return null;

  return (
    <Button
      asChild
      size="sm"
      variant="ghost"
      className="hidden lg:inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/30 transition-all rounded-xl shadow-soft"
    >
      <Link to={config.link || "/bulk-purchase"}>
        <Sparkles className="h-3.5 w-3.5 fill-current" />
        {config.text || "Bulk Purchase"}
      </Link>
    </Button>
  );
}
