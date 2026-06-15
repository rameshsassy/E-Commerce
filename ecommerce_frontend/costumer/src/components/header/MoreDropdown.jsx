import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function MoreDropdown({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-sm font-medium hover:bg-muted/80"
        >
          More <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-1.5 rounded-xl border border-border bg-popover/90 backdrop-blur-md">
        {categories.map((cat) => (
          <DropdownMenuItem key={cat._id} asChild>
            <Link
              to="/products"
              search={{ category: cat.slug }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
            >
              {cat.name}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
