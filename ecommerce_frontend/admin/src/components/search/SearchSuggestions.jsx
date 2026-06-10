import React from 'react';
import { TrendingUp, Clock, Search, ArrowRight } from 'lucide-react';
import { BASE_URL } from '../../utils/api';

const SearchSuggestions = ({ isVisible, query, suggestions, loading, onSelect, onViewAll }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-glass-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in divide-y divide-glass-border z-50">
      
      {/* Suggestions List */}
      {query.length >= 2 ? (
        <div className="p-2">
          {loading ? (
            <div className="p-8 text-center text-text-muted">Loading suggestions...</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((product) => (
                <div 
                  key={product._id} 
                  onClick={() => onSelect(product)}
                  className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                >
                  <img 
                    src={`${BASE_URL}/${product.images?.[0]?.replace(/\\\\/g, '/')}`} 
                    alt={product.title} 
                    className="w-12 h-12 rounded-lg object-cover bg-surface-hover"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-text truncate">{product.title}</h4>
                    <p className="text-sm text-text-muted">₹{product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
              <div 
                onClick={onViewAll}
                className="flex items-center justify-between p-4 mt-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl cursor-pointer transition-colors"
              >
                View all results for "{query}"
                <ArrowRight size={18} />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-text-muted">
              <Search size={32} className="mx-auto mb-3 opacity-20" />
              <p>No products found for "{query}"</p>
              <p className="text-sm mt-1">Try checking your spelling or using different keywords.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 p-6 gap-8">
          {/* Recent Searches (Mocked for now) */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={14} /> Recent Searches
            </h3>
            <ul className="space-y-3">
              {['handcrafted vase', 'wooden table', 'silk saree', 'leather wallet'].map((term, i) => (
                <li key={i} className="text-sm hover:text-primary cursor-pointer transition-colors flex items-center gap-2">
                  <Search size={14} className="text-text-muted" /> {term}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Trending Searches */}
          <div>
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Trending Now
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Diwali Decor', 'Winter Jackets', 'Organic Honey', 'Pooja Thali'].map((tag, i) => (
                <span key={i} className="px-3 py-1.5 bg-white/5 hover:bg-primary/20 hover:text-primary border border-glass-border rounded-full text-xs cursor-pointer transition-colors">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
