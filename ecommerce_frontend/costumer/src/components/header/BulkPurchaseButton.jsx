import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function BulkPurchaseButton({ config }) {
  if (!config || !config.enabled) return null;

  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="hidden lg:inline-flex items-center gap-1.5 font-bold text-red-700 hover:text-red-800 hover:bg-rose-50 border border-red-200 hover:border-red-300 transition-all rounded-full px-4 h-9 shadow-sm"
    >
      <Link to={config.link || "/bulk-purchase"}>
        <Sparkles className="h-3.5 w-3.5 fill-red-700 stroke-red-700 text-red-700" />
        {config.text || "Bulk Purchase"}
      </Link>
    </Button>
  );
}
