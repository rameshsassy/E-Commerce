import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { BASE_URL } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Search,
  Info,
  Check,
  Truck,
  Sparkles,
  AlertCircle,
  Package,
  X,
  DollarSign,
} from 'lucide-react';

export default function SellerBuyProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout modal state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [checkoutMode, setCheckoutMode] = useState(''); // 'single' or 'bulk'
  const [checkoutQty, setCheckoutQty] = useState(1);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('Direct');
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const buyerType = user?.sellerType || 'free';
  const activePlan = user?.subscriptionPlan || 'free';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/seller/buy-products');
      if (res.data && res.data.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products of other sellers on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Fetch buyer's address to prefill shipping details when opening checkout
  const openCheckout = async (product, mode) => {
    setSelectedProduct(product);
    setCheckoutMode(mode);
    setOrderSuccess(null);
    setError('');



    // Set default quantities
    if (mode === 'single') {
      setCheckoutQty(1);
    } else {
      // Bulk purchase requires bulkPurchaseMinOrderQuantity (default 50)
      setCheckoutQty(product.bulkPurchaseMinOrderQuantity || 50);
    }

    setProfileLoading(true);
    try {
      const res = await api.get('/seller/profile');
      const profile = res.data;
      if (profile) {
        setShippingAddress({
          fullName: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user?.name || '',
          phone: profile.mobile || user?.mobile || '',
          addressLine1: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          pinCode: profile.pincode || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile for address prefill', err);
      // Fallback to basic auth context details
      setShippingAddress({
        fullName: user?.name || '',
        phone: user?.mobile || '',
        addressLine1: '',
        city: '',
        state: '',
        pinCode: '',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (checkoutQty <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }

    if (checkoutQty > selectedProduct.stock) {
      alert(`Only ${selectedProduct.stock} units available in stock.`);
      return;
    }

    setOrderProcessing(true);
    setError('');

    try {
      const payload = {
        productId: selectedProduct._id,
        quantity: checkoutQty,
        shippingAddress,
        paymentMethod,
      };

      const res = await api.post('/seller/buy-products/order', payload);
      if (res.data && res.data.success) {
        setOrderSuccess(res.data.order);
        // Refresh products list to update stock amounts
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to place order. Please check inputs.');
    } finally {
      setOrderProcessing(false);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="seller-page animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="seller-page-title mb-1">Bulk Purchase</h1>
          <p className="text-text-muted text-sm">
            Purchase products in bulk directly from fellow marketplace sellers.
          </p>
        </div>

        {/* Badge showing current user type */}
        <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-glass-border rounded-xl w-fit">
          <span className="text-xs text-text-muted font-medium">
            {activePlan === 'premium' && user?.subscriptionActive ? (
              "You are on premium plan"
            ) : activePlan === 'pro' && user?.subscriptionActive ? (
              "You are on pro plan"
            ) : (
              "You are on free plan . Upgrade now to sell in bulk"
            )}
          </span>
          {activePlan === 'premium' && user?.subscriptionActive ? (
            <span className="badge bg-warning/20 text-warning border border-warning/30 font-bold flex items-center gap-1">
              <Sparkles size={12} className="fill-warning/10" /> Premium Seller
            </span>
          ) : activePlan === 'pro' && user?.subscriptionActive ? (
            <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold flex items-center gap-1">
              <Sparkles size={12} className="fill-indigo-500/10" /> Pro Seller
            </span>
          ) : (
            <span className="badge bg-primary/20 text-primary border border-primary/30 font-bold">
              Free Seller
            </span>
          )}
        </div>
      </div>

      {/* Rules Banner (Dynamic & Professional) */}
      <div className="glass-panel p-5 mb-8 border border-glass-border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-[#1e293b]/40">
        <div className="flex gap-4 items-start">
          <Info className="text-primary shrink-0 mt-0.5" size={22} />
          <div>
            <h4 className="font-bold text-white mb-2">Want to sell in bulk?</h4>
            <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
              {activePlan === 'free' ? (
                <>
                  <li>
                    <strong>Free Sellers</strong> cannot offer bulk selling. Any product owned by a Free Seller can only be purchased in single quantities.
                  </li>
                  <li className="text-primary">
                    You are a <strong>Free Seller</strong>: You can buy from Premium and Pro Sellers in bulk, but your purchases from Free Sellers are restricted to <strong>individual quantities</strong> (no bulk options).
                  </li>
                  <li>You can buy from Premium and Pro Sellers in both single and bulk quantities.</li>
                </>
              ) : (
                <>
                  <li>
                    Display your products for the fellow sellers to request for bulk quantity from you
                  </li>
                  <li>
                    All the bulk buying request from sellers, corporates, schools, colleges, and other instutional buyers can be check on 'Orders & Enquiries' page
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => navigate('/seller/premium')}
          className="px-6 py-2 border border-white/40 hover:border-white/80 text-white hover:bg-white/5 bg-transparent text-sm rounded-lg transition-all shrink-0"
        >
          Click to Upgrade
        </button>
      </div>

      {/* Search & Filtering Panel */}
      <div className="glass-panel p-4 mb-6 flex gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search products by title or description..."
            className="input-field pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && !selectedProduct && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl mb-6 text-sm flex gap-2 items-center">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel p-12 text-center text-text-muted">
          <Package size={48} className="mx-auto mb-3 opacity-30" />
          <p className="text-base font-bold">No products available for purchase</p>
          <p className="text-xs">There are no products listed by other sellers matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const productOwnerPlan = product.sellerId?.subscriptionPlan || 'free';
            const isSubscribedOwner = productOwnerPlan === 'premium' || productOwnerPlan === 'pro';
            const businessName = product.sellerId?.businessName || 
                                 `${product.sellerId?.firstName || ''} ${product.sellerId?.lastName || ''}`.trim() || 
                                 'Aashansh Seller';

            // Rules configuration
            const isBulkAllowed = isSubscribedOwner; // Free sellers cannot sell in bulk

            return (
              <div key={product._id} className="glass-panel flex flex-col overflow-hidden hover:border-glass-border/40 transition-all hover:-translate-y-0.5">
                {/* Image Section */}
                <div className="relative aspect-video bg-surface overflow-hidden border-b border-glass-border">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={`${BASE_URL}/${product.images[0].replace(/\\/g, '/')}`}
                      className="w-full h-full object-cover"
                      alt={product.title}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                      <Package size={40} className="opacity-20" />
                    </div>
                  )}

                  {/* Seller Type Badge on Image */}
                  <div className="absolute top-3 right-3">
                    {productOwnerPlan === 'premium' ? (
                      <span className="px-2.5 py-1 text-[10px] bg-[#ffd401] text-black font-extrabold rounded-lg shadow-md flex items-center gap-1">
                        <Sparkles size={10} className="fill-black" /> PREMIUM SELLER
                      </span>
                    ) : productOwnerPlan === 'pro' ? (
                      <span className="px-2.5 py-1 text-[10px] bg-indigo-500 text-white font-extrabold rounded-lg shadow-md flex items-center gap-1">
                        <Sparkles size={10} className="fill-white" /> PRO SELLER
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[10px] bg-[#334155] text-white font-extrabold rounded-lg shadow-md border border-white/10">
                        FREE SELLER
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider mb-1">
                    {product.category}
                  </span>
                  <h3 className="font-bold text-white text-base mb-1 line-clamp-1">{product.title}</h3>
                  <p className="text-xs text-text-muted mb-4 line-clamp-2">{product.description}</p>

                  {/* Price & Stock info */}
                  <div className="flex items-baseline justify-between mb-4 border-y border-glass-border/40 py-2.5">
                    <div>
                      <p className="text-[10px] text-text-muted">Price per unit</p>
                      <span className="text-lg font-bold text-success">₹{product.price}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-text-muted">Available Stock</p>
                      <span className={`text-xs font-semibold ${product.stock > 0 ? 'text-white' : 'text-error'}`}>
                        {product.stock > 0 ? `${product.stock} units` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  {/* Metadata: Seller & Min Quantity */}
                  <div className="text-[11px] text-text-muted mb-5 space-y-1 bg-surface/40 p-2.5 rounded-xl border border-glass-border/30">
                    <p className="truncate">
                      <strong>Seller:</strong> {businessName}
                    </p>
                    {isSubscribedOwner && (
                      <p>
                        <strong>Min Bulk Qty:</strong> {product.bulkPurchaseMinOrderQuantity || 50} units
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="mt-auto flex gap-2">
                    <button
                      type="button"
                      disabled={product.stock <= 0}
                      onClick={() => openCheckout(product, 'single')}
                      className="flex-1 py-2 px-3 bg-surface hover:bg-surface-hover border border-glass-border text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors"
                    >
                      Buy Single
                    </button>

                    {isBulkAllowed ? (
                      <button
                        type="button"
                        disabled={product.stock < (product.bulkPurchaseMinOrderQuantity || 50)}
                        onClick={() => openCheckout(product, 'bulk')}
                        className="flex-1 py-2 px-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl disabled:opacity-50 transition-colors shadow-glow"
                      >
                        Buy in Bulk
                      </button>
                    ) : (
                      <div className="flex-1 text-center py-2 px-2 border border-dashed border-glass-border text-[9px] text-text-muted flex items-center justify-center rounded-xl bg-surface/10 leading-snug">
                        Bulk N/A (Free Seller)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Checkout Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl flex flex-col border border-glass-border shadow-glow">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-glass-border flex justify-between items-center bg-surface/30">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingCart className="text-primary" size={20} />
                  Checkout: {checkoutMode === 'single' ? 'Individual Purchase' : 'Bulk Purchase'}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  Buying from {selectedProduct.sellerId?.businessName || 'fellow seller'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1 rounded-lg text-text-muted hover:text-white hover:bg-surface-hover transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error banner inside modal */}
            {error && (
              <div className="mx-6 mt-4 p-3.5 bg-error/10 border border-error/20 text-error rounded-xl text-xs flex gap-2 items-center">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {/* Success state */}
            {orderSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-success/20 text-success border border-success/30 flex items-center justify-center mb-4">
                  <Check size={36} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Order Placed Successfully!</h3>
                <p className="text-sm text-text-muted mb-6 max-w-sm">
                  Your purchase of <strong>{checkoutQty} x {selectedProduct.title}</strong> has been created. Shipment details are registered.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-glass-border w-full text-left text-xs mb-6 max-w-md space-y-1.5 text-text-muted">
                  <p><strong className="text-white">Order Reference:</strong> {orderSuccess._id}</p>
                  <p><strong className="text-white">Units Purchased:</strong> {checkoutQty}</p>
                  <p><strong className="text-white">Amount Charged:</strong> ₹{orderSuccess.totalAmount.toFixed(2)}</p>
                  <p><strong className="text-white">Status:</strong> Processing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="btn btn-primary px-8"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="p-6 flex-1 flex flex-col gap-6">
                
                {/* 1. Quantity & Pricing Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface/40 p-4 rounded-xl border border-glass-border/40">
                  <div>
                    <label className="block text-xs text-text-muted font-bold uppercase mb-1">
                      Purchase Quantity
                    </label>

                    {/* Rules restriction for Premium/Pro Buyer buying from Free Seller */}
                    {checkoutMode === 'single' &&
                    (activePlan === 'premium' || activePlan === 'pro') &&
                    (selectedProduct.sellerId?.sellerType || 'free') === 'free' ? (
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={1}
                          readOnly
                          className="input-field bg-surface-hover/50 text-text-muted cursor-not-allowed font-bold"
                        />
                        <span className="text-[10px] text-warning flex items-center gap-1 font-semibold">
                          <AlertCircle size={10} /> Locked to 1 unit per rules (Premium/Pro Buyer)
                        </span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={checkoutMode === 'single' ? 1 : (selectedProduct.bulkPurchaseMinOrderQuantity || 50)}
                        max={selectedProduct.stock}
                        required
                        className="input-field"
                        value={checkoutQty}
                        onChange={(e) => setCheckoutQty(Number(e.target.value))}
                      />
                    )}
                    
                    <p className="text-[10px] text-text-muted mt-1">
                      Available Stock: {selectedProduct.stock} units
                      {checkoutMode === 'bulk' && ` (Min bulk: ${selectedProduct.bulkPurchaseMinOrderQuantity || 50})`}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs text-text-muted font-bold uppercase mb-1">
                      Cost Summary
                    </label>
                    <div className="space-y-1.5 text-xs text-text-muted">
                      <div className="flex justify-between">
                        <span>Items Price:</span>
                        <span className="font-semibold text-white">₹{(selectedProduct.price * checkoutQty).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Fee:</span>
                        <span className="font-semibold text-white">
                          {(selectedProduct.price * checkoutQty) > 999 ? 'FREE' : '₹50.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-glass-border pt-1.5 mt-1">
                        <span className="text-white">Total Payable:</span>
                        <span className="text-success">
                          ₹{((selectedProduct.price * checkoutQty) + ((selectedProduct.price * checkoutQty) > 999 ? 0 : 50)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Shipping Address */}
                <div>
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                    <Truck size={16} className="text-primary" /> Shipping Destination Address
                  </h4>
                  {profileLoading ? (
                    <div className="flex items-center gap-2 py-4 justify-center">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs text-text-muted">Loading profile details...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          value={shippingAddress.fullName}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Phone Number</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-text-muted mb-1">Address Details</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          placeholder="Street name, building, apartment"
                          value={shippingAddress.addressLine1}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">City</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">State</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-text-muted mb-1">Pincode</label>
                        <input
                          type="text"
                          required
                          className="input-field text-sm"
                          value={shippingAddress.pinCode}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, pinCode: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Payment Method */}
                <div>
                  <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-1.5">
                    <DollarSign size={16} className="text-primary" /> Payment Selection
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`p-4 border rounded-xl cursor-pointer flex gap-3 transition-all ${paymentMethod === 'Direct' ? 'border-primary bg-primary/5' : 'border-glass-border hover:bg-surface-hover'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'Direct'}
                        onChange={() => setPaymentMethod('Direct')}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-bold text-xs text-white">Direct Checkout</p>
                        <p className="text-[10px] text-text-muted">Instant transfer / Order confirmation</p>
                      </div>
                    </label>

                    <label className={`p-4 border rounded-xl cursor-pointer flex gap-3 transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-glass-border hover:bg-surface-hover'}`}>
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="accent-primary"
                      />
                      <div>
                        <p className="font-bold text-xs text-white">Cash on Delivery (COD)</p>
                        <p className="text-[10px] text-text-muted">Pay with cash upon package receipt</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-glass-border flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="btn btn-secondary flex-1 py-3 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={orderProcessing || profileLoading}
                    className="btn btn-primary flex-1 py-3 text-sm font-bold shadow-glow"
                  >
                    {orderProcessing ? 'Processing...' : 'Confirm and Place Order'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
