import React from 'react';
import { ArrowDownAZ } from 'lucide-react';

const SortDropdown = ({ sort, setSort }) => {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-text-muted flex items-center gap-1">
        <ArrowDownAZ size={16} /> Sort by:
      </label>
      <div className="relative">
        <select 
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="appearance-none bg-surface border border-glass-border rounded-lg pl-4 pr-10 py-2 text-sm focus:border-primary outline-none transition-colors cursor-pointer font-medium hover:border-text-muted/50"
        >
          <option value="newest">Newest Arrivals</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          {/* <option value="best-selling">Best Selling</option> */}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default SortDropdown;
