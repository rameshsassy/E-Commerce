import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { productApi } from "@/lib/services";

export function BulkPurchaseButton({ config }) {
  // Check if any bulk-purchase-enabled products exist
  const { data } = useQuery({
    queryKey: ["products", "bulkCheck"],
    queryFn: () => productApi.list({ limit: 1, bulkPurchase: true }),
    staleTime: 5 * 60 * 1000, // cache for 5 min to avoid repeated calls
  });

  const productList = Array.isArray(data) ? data : data?.products || [];
  const hasBulkProducts = productList.some(
    (p) => p.bulkPurchaseEnabled === true
  );

  if (!config || !config.enabled || !hasBulkProducts) return null;

  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="hidden lg:inline-flex items-center gap-1.5 font-bold text-[#0f172a] hover:text-[#0f172a] bg-[#ffd401] hover:bg-[#e6bf00] border border-[#e6bf00] hover:border-[#ccaa00] transition-all rounded-full px-4 h-9 shadow-sm"
    >
      <Link to={config.link || "/bulk-purchase"}>
        <Sparkles className="h-3.5 w-3.5 fill-[#0f172a] stroke-[#0f172a] text-[#0f172a]" />
        {config.text || "Bulk Purchase"}
      </Link>
    </Button>
  );
}
