import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const categories = ["Electronics", "Clothing", "Home", "Books", "Toys", "Beauty"];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `/products?page=${page}`;
      if (searchTerm) query += `&keyword=${searchTerm}`;
      if (category) query += `&category=${category}`;
      if (minPrice) query += `&minPrice=${minPrice}`;
      if (maxPrice) query += `&maxPrice=${maxPrice}`;
      
      const { data } = await api.get(query);
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, category]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); 
    fetchProducts();
  };

  const handleFilterApply = () => {
    setPage(1);
    fetchProducts();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSearchTerm('');
    setPage(1);
    // Let the useEffect handle the fetch after state resets, or call fetch manually
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in flex flex-col gap-6 flex-1 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Our Collection</h1>
          <p className="text-text-muted">Browse through our verified products</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-3 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary hidden md:block">
            Search
          </button>
          <button 
            type="button" 
            className="btn btn-secondary md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} />
          </button>
        </form>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <div className={`w-full md:w-64 shrink-0 glass-panel p-6 rounded-2xl md:sticky md:top-24 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2"><Filter size={18} /> Filters</h2>
            <button className="md:hidden text-text-muted hover:text-white" onClick={() => setShowFilters(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Category</h3>
              <div className="space-y-2">
                <button 
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${category === '' ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-surface'}`}
                  onClick={() => setCategory('')}
                >
                  All Categories
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${category === cat ? 'bg-primary/20 text-primary font-medium' : 'hover:bg-surface'}`}
                    onClick={() => setCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-glass-border">
              <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">Price Range</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="input-field w-full text-sm py-2 px-3"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                />
                <span className="text-text-muted">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="input-field w-full text-sm py-2 px-3"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-glass-border flex flex-col gap-3">
              <button onClick={handleFilterApply} className="btn btn-primary w-full py-2">Apply Filters</button>
              <button onClick={clearFilters} className="btn bg-surface hover:bg-surface-hover text-text w-full py-2">Clear All</button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 w-full min-h-[500px] flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel p-16 text-center flex-1 flex flex-col items-center justify-center rounded-2xl">
              <Filter size={48} className="text-text-muted mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-text-muted">Try adjusting your search criteria or clear filters.</p>
              <button onClick={clearFilters} className="btn btn-secondary mt-6">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Link to={`/product/${product._id}`} key={product._id} className="glass-panel rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-300 group flex flex-col">
                    <div className="h-48 bg-surface relative overflow-hidden shrink-0 group/slider">
                      {product.images && product.images.length > 0 ? (
                        <div className="w-full h-full relative">
                          <img 
                            src={`http://localhost:5000/${product.images[0].replace(/\\/g, '/')}`} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          {/* If multiple images, show a small indicator or let the first one be visible. Since making a full slider inside a card is complex, we'll show the second image on hover */}
                          {product.images.length > 1 && (
                            <img 
                              src={`http://localhost:5000/${product.images[1].replace(/\\/g, '/')}`} 
                              alt={`${product.title} alternate`}
                              className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                            />
                          )}
                        </div>
                      ) : (
                        <img 
                          src="https://placehold.co/400x300/1e293b/f8fafc?text=No+Image"
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      )}
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute top-2 right-2 bg-warning text-warning-foreground text-xs font-bold px-2 py-1 rounded shadow-lg z-20">
                          Only {product.stock} left!
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute top-2 right-2 bg-error text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-20">
                          Out of Stock
                        </span>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <h3 className="text-lg font-bold line-clamp-1">{product.title}</h3>
                        <span className="font-bold text-success shrink-0">${product.price}</span>
                      </div>
                      <span className="text-xs bg-surface-hover px-2 py-1 rounded-md w-fit mb-3 text-text-muted">{product.category}</span>
                      <p className="text-sm text-text-muted mb-4 line-clamp-2 flex-1">{product.description}</p>
                      
                      <div className="mt-auto flex justify-between items-center text-sm border-t border-glass-border pt-4 mt-4">
                        <span className="text-text-muted flex items-center gap-1">
                          Seller: <span className="font-medium text-text">{product.sellerId?.firstName || 'Verified'}</span>
                        </span>
                        <span className="text-primary font-medium group-hover:underline">View Details &rarr;</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="font-medium text-text-muted bg-surface px-4 py-2 rounded-lg">
                    Page <span className="text-white font-bold">{page}</span> of {totalPages}
                  </span>
                  <button 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
