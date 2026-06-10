import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SearchSuggestions from './SearchSuggestions';
import api from '../../utils/api';

const SearchBar = ({ onSearchSubmit }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Debounce search effect
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query.trim() || query.length < 2) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/products?keyword=${query}&limit=5`);
        setSuggestions(data.products || []);
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      setIsFocused(false);
      if (onSearchSubmit) {
        onSearchSubmit(query);
      } else {
        navigate(`/products?keyword=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50" ref={wrapperRef}>
      <form onSubmit={handleSubmit} className={`relative flex items-center bg-surface border transition-all duration-300 rounded-full overflow-hidden ${isFocused ? 'border-primary ring-4 ring-primary/20 shadow-lg' : 'border-glass-border shadow-sm hover:border-text-muted/30'}`}>
        <div className="pl-5 text-text-muted">
          {loading ? <Loader2 size={20} className="animate-spin text-primary" /> : <Search size={20} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search for products, categories, or keywords..."
          className="w-full bg-transparent border-none px-4 py-4 focus:ring-0 text-text placeholder-text-muted outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="pr-4 text-text-muted hover:text-text transition-colors">
            <X size={18} />
          </button>
        )}
        <button type="submit" className="bg-primary text-white px-6 py-4 font-bold hover:bg-primary-hover transition-colors rounded-r-full">
          Search
        </button>
      </form>

      {/* Suggestions Dropdown */}
      <SearchSuggestions 
        isVisible={isFocused && (query.length > 0 || suggestions.length > 0)}
        query={query}
        suggestions={suggestions}
        loading={loading}
        onSelect={(product) => {
          setIsFocused(false);
          navigate(`/product/${product._id}`);
        }}
        onViewAll={handleSubmit}
      />
    </div>
  );
};

export default SearchBar;
