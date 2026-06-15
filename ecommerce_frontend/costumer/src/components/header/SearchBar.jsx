import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { publicApi } from "@/lib/services";
import { Input } from "@/components/ui/input";

export function SearchBar({ config }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["searchSuggestions", debouncedTerm],
    queryFn: () => publicApi.getSearchSuggestions(debouncedTerm),
    enabled: debouncedTerm.trim().length >= 2,
  });

  // Simple click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!config || !config.enabled) return null;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate({ to: "/products", search: { search: searchTerm.trim() } });
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (type, item) => {
    setShowSuggestions(false);
    setSearchTerm("");
    if (type === "product") {
      navigate({ to: `/products/${item._id}` });
    } else if (type === "category") {
      navigate({ to: "/products", search: { category: item.slug } });
    } else if (type === "brand") {
      navigate({ to: "/products", search: { search: item.name } });
    }
  };

  const hasSuggestions =
    suggestions &&
    (suggestions.products?.length > 0 ||
      suggestions.categories?.length > 0 ||
      suggestions.brands?.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden md:block">
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={config.placeholder || "Search products, brands, categories..."}
          className="w-full h-10 pl-10 pr-4 rounded-full bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/45 focus-visible:border-primary/20 transition-all text-sm"
        />
        {isLoading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
            <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </form>

      {/* Suggestions Overlay */}
      {showSuggestions && debouncedTerm.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border bg-popover text-popover-foreground shadow-elegant max-h-[420px] overflow-y-auto z-[100] p-4 divide-y divide-border">
          {isLoading && !hasSuggestions ? (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
              <Loader2 className="animate-spin h-4 w-4" /> Searching...
            </div>
          ) : !hasSuggestions ? (
            <div className="text-center py-6 text-sm text-muted-foreground">
              No matches found for "{debouncedTerm}"
            </div>
          ) : (
            <>
              {/* Categories Section */}
              {suggestions.categories?.length > 0 && (
                <div className="pb-3 mb-3">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5">
                    Categories
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => handleSuggestionClick("category", cat)}
                        className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors font-medium border border-transparent hover:border-primary/15"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands Section */}
              {suggestions.brands?.length > 0 && (
                <div className="py-3 mb-3">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1.5">
                    Brands & Sellers
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.brands.map((brand) => (
                      <button
                        key={brand._id}
                        onClick={() => handleSuggestionClick("brand", brand)}
                        className="px-3 py-1 text-xs rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors font-medium border border-transparent hover:border-primary/15"
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {suggestions.products?.length > 0 && (
                <div className="pt-3">
                  <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">
                    Products
                  </h4>
                  <div className="flex flex-col gap-1.5">
                    {suggestions.products.map((prod) => {
                      const img = prod.images?.[0] || "https://placehold.co/100x100";
                      return (
                        <button
                          key={prod._id}
                          onClick={() => handleSuggestionClick("product", prod)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 text-left transition-colors w-full"
                        >
                          <img
                            src={img}
                            alt={prod.title}
                            className="h-10 w-10 rounded-lg object-cover bg-muted"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">
                              {prod.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              in {prod.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-primary">
                              ₹{prod.price?.toLocaleString("en-IN")}
                            </span>
                            <ArrowRight className="h-3 w-3 text-muted-foreground mt-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
