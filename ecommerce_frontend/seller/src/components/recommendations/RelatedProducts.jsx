import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

const RelatedProducts = ({ title = "You may also like" }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch random products for recommendations (or base it on category if provided)
    const fetchRecommendations = async () => {
      try {
        const { data } = await api.get('/products?limit=4&sort=newest'); // Simplified: grabbing 4 newest/random
        setProducts(data.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleAddToCart = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    
    try {
      await api.post('/customer/cart', { productId, quantity: 1 });
      // In a real app we might dispatch an event to update cart count or show a toast
      alert('Product added to cart!');
    } catch (error) {
      console.error(error);
      alert('Failed to add to cart.');
    }
  };

  if (loading) return null; // Or a skeleton loader
  if (products.length === 0) return null;

  return (
    <div className="mt-16 animate-fade-in">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <span className="w-8 h-1 bg-primary rounded-full"></span>
        {title}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="group relative">
            <Link to={`/product/${product._id}`} className="block glass-panel rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-500 hover:-translate-y-1 border-glass-border">
              <div className="relative aspect-square overflow-hidden bg-surface">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={`${BASE_URL}/${product.images[0].replace(/\\/g, '/')}`} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted bg-surface-hover">No Image</div>
                )}
                
                <div className="absolute bottom-4 left-4 right-4 translate-y-12 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                  <button 
                    onClick={(e) => handleAddToCart(e, product._id)}
                    className="flex-1 bg-white text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 hover:bg-primary hover:text-white transition-colors text-xs shadow-xl"
                  >
                    <ShoppingCart size={14} /> Add
                  </button>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    className="w-10 bg-black/40 backdrop-blur-md text-white border border-white/20 rounded-xl flex items-center justify-center hover:bg-secondary hover:border-secondary transition-colors shadow-xl"
                  >
                    <Heart size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-sm font-bold mb-1 truncate group-hover:text-primary transition-colors">{product.title}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-white">Rs. {product.price.toLocaleString()}</span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-xs text-text-muted line-through opacity-60">Rs. {product.compareAtPrice}</span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
