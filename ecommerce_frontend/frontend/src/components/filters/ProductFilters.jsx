import React from 'react';
import { Filter, X } from 'lucide-react';

const ProductFilters = ({ filters, setFilters, categories = ['Electronics', 'Clothing', 'Home', 'Handcrafted', 'Beauty'] }) => {
  
  const handleCategoryChange = (category) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? '' : category,
      page: 1
    }));
  };

  const handlePriceChange = (e, type) => {
    setFilters(prev => ({
      ...prev,
      [type]: e.target.value,
      page: 1
    }));
  };

  const clearFilters = () => {
    setFilters({ keyword: filters.keyword, category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1 });
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice;

  return (
    <div className="glass-panel p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Filter size={18} /> Filters
        </h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center">
            Clear all <X size={12} className="ml-1" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="mb-8">
        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Categories</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 rounded border border-glass-border bg-surface group-hover:border-primary transition-colors">
                <input 
                  type="checkbox" 
                  className="opacity-0 absolute"
                  checked={filters.category === cat}
                  onChange={() => handleCategoryChange(cat)}
                />
                {filters.category === cat && <div className="w-3 h-3 bg-primary rounded-sm" />}
              </div>
              <span className={`text-sm ${filters.category === cat ? 'text-primary font-medium' : 'text-text group-hover:text-primary transition-colors'}`}>
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">Price Range</h4>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-text-muted text-sm">₹</span>
            <input 
              type="number" 
              placeholder="Min" 
              value={filters.minPrice}
              onChange={(e) => handlePriceChange(e, 'minPrice')}
              className="w-full bg-surface border border-glass-border rounded-lg pl-7 pr-3 py-2 text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
          <span className="text-text-muted">-</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-text-muted text-sm">₹</span>
            <input 
              type="number" 
              placeholder="Max" 
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange(e, 'maxPrice')}
              className="w-full bg-surface border border-glass-border rounded-lg pl-7 pr-3 py-2 text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProductFilters;
