import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';

const Wishlist = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/customer/wishlist');
      setWishlistItems(data.products || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const removeFromWishlist = async (productId) => {
    try {
      await api.post('/customer/wishlist/toggle', { productId });
      setWishlistItems(wishlistItems.filter(item => item._id !== productId));
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const moveToCart = async (product) => {
    try {
      await api.post('/customer/cart', { productId: product._id, quantity: 1 });
      await removeFromWishlist(product._id);
      // You could trigger a cart count update here via context
    } catch (err) {
      console.error('Error moving to cart:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <Heart size={32} className="text-secondary fill-secondary/20" />
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <span className="badge bg-surface text-text-muted ml-auto">{wishlistItems.length} Items</span>
      </div>

      {wishlistItems.length === 0 ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center justify-center rounded-3xl min-h-[50vh]">
          <Heart size={64} className="text-text-muted opacity-30 mb-6" />
          <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
          <p className="text-text-muted mb-8 max-w-md">
            Save items you love to your wishlist. Review them anytime and easily move them to your cart.
          </p>
          <Link to="/products" className="btn btn-primary px-8 py-3 rounded-full shadow-glow">
            Discover Products <ArrowRight size={20} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {wishlistItems.map((product) => (
            <div key={product._id} className="glass-panel p-4 rounded-2xl flex gap-4 hover:shadow-lg transition-all group">
              <div className="w-32 h-32 rounded-xl bg-surface overflow-hidden shrink-0">
                <img 
                  src={product.images && product.images.length > 0 ? `${BASE_URL}/${product.images[0].replace(/\\/g, '/')}` : 'https://placehold.co/400x400/1e293b/f8fafc'} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="flex flex-col flex-grow py-1">
                <Link to={`/product/${product._id}`} className="font-bold text-lg line-clamp-1 hover:text-primary transition-colors">
                  {product.title}
                </Link>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <span className="text-xl font-black text-success">Rs. {product.price.toFixed(2)}</span>
                  {product.compareAtPrice > product.price && (
                    <span className="text-xs text-text-muted line-through">Rs. {product.compareAtPrice.toFixed(2)}</span>
                  )}
                </div>
                
                {product.stock > 0 ? (
                  <span className="text-xs text-success mb-auto">In Stock</span>
                ) : (
                  <span className="text-xs text-error mb-auto">Out of Stock</span>
                )}

                <div className="flex items-center gap-2 mt-4">
                  <button 
                    className="btn btn-primary flex-1 py-2 text-sm px-2 shadow-md"
                    onClick={() => moveToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart size={16} /> Add to Cart
                  </button>
                  <button 
                    className="btn btn-secondary p-2 hover:text-error hover:border-error transition-colors shrink-0"
                    onClick={() => removeFromWishlist(product._id)}
                    title="Remove from Wishlist"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
