import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, SlidersHorizontal, ShoppingCart, Heart } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../utils/api';
import SortDropdown from '../../components/filters/SortDropdown';
import ProductFilters from '../../components/filters/ProductFilters';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../../components/auth/AuthModal';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();
  
  // States derived from URL
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: searchParams.get('sort') || 'newest',
    page: parseInt(searchParams.get('page')) || 1
  });
  
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = `/products?page=${filters.page}&limit=12`;
      if (filters.keyword) query += `&keyword=${encodeURIComponent(filters.keyword)}`;
      if (filters.category) query += `&category=${encodeURIComponent(filters.category)}`;
      if (filters.minPrice) query += `&minPrice=${filters.minPrice}`;
      if (filters.maxPrice) query += `&maxPrice=${filters.maxPrice}`;
      if (filters.sort) query += `&sort=${filters.sort}`;
      
      const { data } = await api.get(query);
      setProducts(data.products || []);
      setTotalPages(data.pages || 1);
      setTotalResults(data.total || 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL when searchParams change (e.g. from SearchBar in Navbar)
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      keyword: searchParams.get('keyword') || '',
      category: searchParams.get('category') || '',
      page: parseInt(searchParams.get('page')) || 1
    }));
  }, [searchParams]);

  // Sync URL with state when filters change
  useEffect(() => {
    const params = {};
    if (filters.keyword) params.keyword = filters.keyword;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.sort !== 'newest') params.sort = filters.sort;
    if (filters.page > 1) params.page = filters.page;
    
    setSearchParams(params);

    const timer = setTimeout(() => {
      fetchProducts();
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [filters.category, filters.minPrice, filters.maxPrice, filters.sort, filters.page, filters.keyword]);

  const categories = ["Bags", "Jewellery", "Snacks", "Women Hygiene", "Books", "Lifestyle", "Handcrafted", "Electronics", "Clothing", "Home", "Beauty"];

  const navigate = useNavigate();

  const handleAddToCart = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      await api.post('/customer/cart', { productId: product._id, quantity: 1 });
      navigate('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in flex flex-col gap-6 flex-1 max-w-7xl mx-auto w-full">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-glass-border pb-6">
        <div>
          <nav className="text-xs text-text-muted mb-2 flex items-center gap-2">
            <Link to="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-text">Products</span>
            {filters.category && (
              <>
                <span>/</span>
                <span className="text-primary font-medium">{filters.category}</span>
              </>
            )}
          </nav>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-text-muted mb-2">
            {filters.category || 'All Products'}
          </h1>
          <p className="text-text-muted text-sm">Showing {products.length} of {totalResults} handcrafted items</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <SortDropdown sort={filters.sort} setSort={(val) => setFilters(prev => ({...prev, sort: val, page: 1}))} />
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden btn btn-secondary flex items-center gap-2 py-2 px-4"
          >
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start relative">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden md:block w-72 shrink-0">
          <ProductFilters filters={filters} setFilters={setFilters} categories={categories} />
        </div>

        {/* Mobile Filters Overlay */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-[100] md:hidden bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-surface p-6 shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Filters</h2>
                <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <ChevronRight size={24} />
                </button>
              </div>
              <ProductFilters filters={filters} setFilters={setFilters} categories={categories} />
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="btn btn-primary w-full mt-8 py-3"
              >
                Show Results
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1 w-full min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass-panel h-[400px] rounded-2xl animate-pulse bg-white/5" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel py-32 text-center rounded-3xl flex flex-col items-center justify-center border border-dashed border-glass-border">
              <div className="w-24 h-24 bg-surface-hover rounded-full flex items-center justify-center mb-6">
                <SlidersHorizontal size={40} className="text-text-muted opacity-30" />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">No matches found</h3>
              <p className="text-text-muted max-w-xs mx-auto mb-8">
                We couldn't find any products matching your current filters. Try adjusting them or clear everything.
              </p>
              <button 
                onClick={() => setFilters({keyword: '', category: '', minPrice: '', maxPrice: '', sort: 'newest', page: 1})}
                className="btn btn-primary px-8"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <div key={product._id} className="group relative">
                    <Link to={`/product/${product._id}`} className="block glass-panel rounded-3xl overflow-hidden hover:shadow-glow transition-all duration-500 hover:-translate-y-2 border-glass-border hover:border-primary/50">
                      {/* Image Container */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                        {product.images && product.images.length > 0 ? (
                          <>
                            <img 
                              src={`${BASE_URL}/${product.images[0].replace(/\\/g, '/')}`} 
                              alt={product.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            {product.images.length > 1 && (
                              <img 
                                src={`${BASE_URL}/${product.images[1].replace(/\\/g, '/')}`} 
                                alt={product.title}
                                className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                              />
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-hover">
                            No Image Available
                          </div>
                        )}
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {product.category}
                          </span>
                          {product.compareAtPrice > product.price && (
                            <span className="bg-secondary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                              Sale
                            </span>
                          )}
                        </div>

                        {/* Quick Actions Overlay */}
                        <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex gap-2">
                          <button 
                            onClick={(e) => handleAddToCart(e, product)}
                            className="flex-1 bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors text-sm shadow-2xl"
                          >
                            <ShoppingCart size={18} /> Add to Cart
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            className="w-12 bg-black/40 backdrop-blur-md text-white border border-white/20 rounded-xl flex items-center justify-center hover:bg-secondary hover:border-secondary transition-colors shadow-2xl"
                          >
                            <Heart size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Info Container */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors truncate">{product.title}</h3>
                        <div className="flex items-baseline gap-3 mb-4">
                          <span className="text-2xl font-black text-white">Rs. {product.price.toLocaleString()}</span>
                          {product.compareAtPrice > product.price && (
                            <span className="text-sm text-text-muted line-through opacity-60">Rs. {product.compareAtPrice.toLocaleString()}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] font-bold text-text-muted uppercase tracking-widest pt-4 border-t border-glass-border">
                          <span>Verified Seller</span>
                          <span className="text-primary">{product.sellerId?.businessName || product.sellerId?.firstName || 'Aashansh'}</span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-12 border-t border-glass-border">
                  <button 
                    onClick={() => setFilters(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
                    disabled={filters.page === 1}
                    className="p-4 rounded-2xl bg-surface border border-glass-border hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setFilters(prev => ({...prev, page: i + 1}))}
                      className={`w-12 h-12 rounded-2xl font-bold transition-all ${filters.page === i + 1 ? 'bg-primary text-white scale-110 shadow-glow' : 'bg-surface border border-glass-border hover:border-text-muted'}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button 
                    onClick={() => setFilters(prev => ({...prev, page: Math.min(totalPages, prev.page + 1)}))}
                    disabled={filters.page === totalPages}
                    className="p-4 rounded-2xl bg-surface border border-glass-border hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
