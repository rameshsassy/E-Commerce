import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Store, ShieldCheck } from 'lucide-react';

import api, { BASE_URL } from '../../utils/api';
import RelatedProducts from '../../components/recommendations/RelatedProducts';

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/customer/cart');
      setCartData(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId, currentQty, change) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    
    // Optimistic UI update
    const updatedItems = cartData.items.map(item => 
      item.product._id === productId ? { ...item, quantity: newQty } : item
    );
    setCartData({ ...cartData, items: updatedItems });

    try {
      await api.put(`/customer/cart/${productId}`, { quantity: newQty });
    } catch (err) {
      console.error('Error updating quantity:', err);
      fetchCart(); // Revert on error
    }
  };

  const removeItem = async (productId) => {
    try {
      await api.delete(`/customer/cart/${productId}`);
      setCartData({
        ...cartData,
        items: cartData.items.filter(item => item.product._id !== productId)
      });
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  // Group items by seller for multi-vendor display
  const groupItemsBySeller = () => {
    if (!cartData || !cartData.items) return {};
    
    return cartData.items.reduce((acc, item) => {
      const sellerId = item.product.seller?._id || 'unknown';
      const sellerName = item.product.seller?.businessName || item.product.seller?.firstName || 'Aashansh Assured';
      
      if (!acc[sellerId]) {
        acc[sellerId] = { name: sellerName, items: [] };
      }
      acc[sellerId].items.push(item);
      return acc;
    }, {});
  };

  const calculateSubtotal = () => {
    if (!cartData || !cartData.items) return 0;
    return cartData.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const groupedItems = groupItemsBySeller();
  const subtotal = calculateSubtotal();
  const shipping = subtotal > 999 ? 0 : 50; // Example shipping logic
  const total = subtotal + shipping;

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingBag size={32} className="text-primary fill-primary/20" />
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="badge bg-surface text-text-muted ml-auto">{cartData?.items?.length || 0} Items</span>
      </div>

      {!cartData || cartData.items.length === 0 ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center justify-center rounded-3xl min-h-[50vh]">
          <ShoppingBag size={64} className="text-text-muted opacity-30 mb-6" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-text-muted mb-8 max-w-md">
            Looks like you haven't added anything to your cart yet. Discover beautiful handcrafted products!
          </p>
          <Link to="/products" className="btn btn-primary px-8 py-3 rounded-full shadow-glow">
            Start Shopping <ArrowRight size={20} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cart Items List */}
          <div className="flex-1 w-full space-y-6">
            {Object.keys(groupedItems).map(sellerId => (
              <div key={sellerId} className="glass-panel rounded-2xl overflow-hidden">
                <div className="bg-surface/50 p-4 border-b border-glass-border flex items-center gap-2">
                  <Store size={18} className="text-text-muted" />
                  <span className="font-bold text-sm tracking-wide text-text-muted uppercase">Sold by: {groupedItems[sellerId].name}</span>
                </div>
                
                <div className="p-4 flex flex-col gap-4">
                  {groupedItems[sellerId].items.map((item) => (
                    <div key={item.product._id} className="flex gap-4 p-4 rounded-xl bg-bg/50 border border-glass-border hover:border-primary/30 transition-colors">
                      <div className="w-24 h-24 rounded-lg bg-surface overflow-hidden shrink-0">
                        <img 
                          src={item.product.images && item.product.images.length > 0 ? `${BASE_URL}/${item.product.images[0].replace(/\\/g, '/')}` : 'https://placehold.co/400x400/1e293b/f8fafc'} 
                          alt={item.product.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex flex-col flex-grow">
                        <div className="flex justify-between items-start gap-4">
                          <Link to={`/product/${item.product._id}`} className="font-bold text-lg hover:text-primary transition-colors line-clamp-1">
                            {item.product.title}
                          </Link>
                          <span className="font-black text-success whitespace-nowrap">Rs. {(item.product.price * item.quantity).toFixed(2)}</span>
                        </div>
                        
                        <p className="text-sm text-text-muted mt-1 mb-4">Rs. {item.product.price.toFixed(2)} each</p>
                        
                        <div className="mt-auto flex items-center justify-between">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-3 bg-surface rounded-lg p-1 border border-glass-border">
                                <button 
                                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-muted transition-colors disabled:opacity-50"
                                  onClick={() => updateQuantity(item.product._id, item.quantity, -1)}
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="w-6 text-center font-bold">{item.quantity}</span>
                                <button 
                                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-muted transition-colors disabled:opacity-50"
                                  onClick={() => updateQuantity(item.product._id, item.quantity, 1)}
                                  disabled={item.quantity >= 5 || item.quantity >= item.product.stock}
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              {item.quantity >= 5 && (
                                <span className="text-[10px] text-warning mt-1 font-medium">Max 5 units</span>
                              )}
                            </div>
                          
                          <button 
                            className="text-text-muted hover:text-error flex items-center gap-1 text-sm font-medium transition-colors"
                            onClick={() => removeItem(item.product._id)}
                          >
                            <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-96 glass-panel p-6 rounded-2xl sticky top-24 shrink-0 h-fit">
            <h2 className="text-xl font-bold mb-6 border-b border-glass-border pb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-text-muted">
                <span>Items Total ({cartData.items.length})</span>
                <span>Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-success font-bold">FREE</span> : `Rs. ${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-primary bg-primary/10 p-2 rounded-md">
                  Add Rs. {(1000 - subtotal).toFixed(2)} more for free shipping!
                </p>
              )}
            </div>
            
            <div className="border-t border-glass-border pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black text-success">Rs. {total.toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary w-full py-4 text-lg font-bold shadow-glow flex justify-between items-center px-6"
              onClick={() => navigate('/checkout')}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight size={20} />
            </button>
            
            <div className="mt-6 flex justify-center items-center gap-2 text-text-muted text-sm">
              <ShieldCheck size={16} className="text-success" />
              <span>Safe and secure payments</span>
            </div>
          </div>
        </div>
      )}

      <RelatedProducts title="Recommended for you" />
    </div>
  );
};

export default Cart;
