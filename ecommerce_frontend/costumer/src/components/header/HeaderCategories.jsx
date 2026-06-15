import { Link } from "@tanstack/react-router";
import { MoreDropdown } from "./MoreDropdown";
import { Button } from "@/components/ui/button";

export function HeaderCategories({ categories = [] }) {
  const activeCats = categories.filter((c) => c.isActive);
  const directCats = activeCats.slice(0, 3);
  const dropdownCats = activeCats.slice(3);

  return (
    <div className="hidden lg:flex items-center gap-1.5">
      {directCats.map((cat) => (
        <Button
          key={cat._id}
          asChild
          variant="ghost"
          size="sm"
          className="text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          <Link to="/products" search={{ category: cat.slug }}>
            {cat.name}
          </Link>
        </Button>
      ))}

      {dropdownCats.length > 0 && (
        <MoreDropdown categories={dropdownCats} />
      )}
    </div>
  );
}
