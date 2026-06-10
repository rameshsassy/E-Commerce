import React from 'react';
import { Filter, X } from 'lucide-react';
import { buildCategoryBrowsePath } from '../../utils/categoryPageSeo';

const ProductFilters = ({
  filters,
  setFilters,
  mainCategories = [],
  onBrowseCategory,
}) => {
  const handleMainCategory = (main) => {
    const isActive = filters.main === main && !filters.sub && !filters.type;
    if (isActive) {
      if (onBrowseCategory) onBrowseCategory({});
      else setFilters((prev) => ({ ...prev, main: '', sub: '', type: '', legacyCategory: '', page: 1 }));
      return;
    }
    if (onBrowseCategory) {
      onBrowseCategory({ main });
    } else {
      setFilters((prev) => ({
        ...prev,
        main,
        sub: '',
        type: '',
        legacyCategory: '',
        page: 1,
      }));
    }
  };

  const handlePriceChange = (e, type) => {
    setFilters((prev) => ({
      ...prev,
      [type]: e.target.value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    if (onBrowseCategory) {
      onBrowseCategory({});
    } else {
      setFilters({
        keyword: filters.keyword,
        main: '',
        sub: '',
        type: '',
        legacyCategory: '',
        minPrice: '',
        maxPrice: '',
        sort: 'newest',
        page: 1,
      });
    }
  };

  const hasActiveFilters =
    filters.main ||
    filters.sub ||
    filters.type ||
    filters.legacyCategory ||
    filters.minPrice ||
    filters.maxPrice;

  return (
    <div className="glass-panel p-6 sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Filter size={18} /> Filters
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-primary hover:underline flex items-center"
          >
            Clear all <X size={12} className="ml-1" />
          </button>
        )}
      </div>

      <div className="mb-8">
        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
          Main categories
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {mainCategories.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5 rounded border border-glass-border bg-surface group-hover:border-primary transition-colors">
                <input
                  type="checkbox"
                  className="opacity-0 absolute"
                  checked={filters.main === cat && !filters.sub}
                  onChange={() => handleMainCategory(cat)}
                />
                {filters.main === cat && !filters.sub && (
                  <div className="w-3 h-3 bg-primary rounded-sm" />
                )}
              </div>
              <span
                className={`text-sm ${
                  filters.main === cat && !filters.sub
                    ? 'text-primary font-medium'
                    : 'text-text group-hover:text-primary transition-colors'
                }`}
              >
                {cat}
              </span>
            </label>
          ))}
        </div>
        {filters.main && (
          <p className="text-[11px] text-text-muted mt-3">
            Browsing:{' '}
            <span className="text-primary font-medium">
              {buildCategoryBrowsePath({
                main: filters.main,
                sub: filters.sub,
                type: filters.type,
              })}
            </span>
          </p>
        )}
      </div>

      <div>
        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">
          Price Range
        </h4>
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
