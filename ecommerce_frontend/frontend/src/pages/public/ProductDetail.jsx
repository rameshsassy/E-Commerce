import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, ShieldCheck, MapPin, Package, Heart, Share2, Star, MessageSquare, Plus, Minus, Boxes } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';
import RatingSummary from '../../components/reviews/RatingSummary';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReviewCard from '../../components/reviews/ReviewCard';
import AuthModal from '../../components/auth/AuthModal';
import BulkOrderModal from '../../components/bulk/BulkOrderModal';
import { useAuth } from '../../context/AuthContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [sortOption, setSortOption] = useState('newest');
  const [filterOption, setFilterOption] = useState('all');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [bulkOrderOpen, setBulkOrderOpen] = useState(false);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null); // { checking: boolean, serviceable: boolean, message: string }
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        const [prodRes, revRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/products/${id}/reviews?sort=${sortOption}&filter=${filterOption}`)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id, sortOption, filterOption]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <Package size={64} className="text-error/50 mb-4" />
        <h2 className="text-2xl font-bold text-error mb-2">Product Not Found</h2>
        <p className="text-text-muted mb-6">{error || 'The product you are looking for does not exist or was removed.'}</p>
        <button onClick={() => navigate('/products')} className="btn btn-primary">
          Back to Products
        </button>
      </div>
    );
  }

  const isPremiumSeller = Boolean(
    product.sellerId?.sellerType === 'premium' &&
      product.sellerId?.subscriptionActive === true &&
      product.sellerId?.bulkPurchaseEnabled !== false
  );

  const openBulkOrder = () => {
    if (user && user.role !== 'customer') {
      alert('Bulk orders are for buyers. Please use a customer account or continue as a guest.');
      return;
    }
    setBulkOrderOpen(true);
  };

  const handleAddToCart = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await api.post('/customer/cart', { productId: product._id, quantity });
      navigate('/cart');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    try {
      await api.post('/customer/cart', { productId: product._id, quantity });
      navigate('/checkout');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process Buy Now');
    }
  };

  const handlePincodeCheck = async (e) => {
    e.preventDefault();
    if (!pincode || pincode.length < 6) return;
    
    setPincodeStatus({ checking: true, serviceable: null, message: '' });
    try {
      const { data } = await api.get(`/products/${id}/check-pincode?pincode=${pincode}`);
      setPincodeStatus({
        checking: false,
        serviceable: data.serviceable,
        message: data.message
      });
    } catch (_err) {
      setPincodeStatus({
        checking: false,
        serviceable: false,
        message: 'Could not verify pincode. Please try again later.'
      });
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-6xl mx-auto w-full">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <BulkOrderModal
        open={bulkOrderOpen}
        onClose={() => setBulkOrderOpen(false)}
        productId={product._id}
        productTitle={product.title}
        defaultName={user?.role === 'customer' ? user.firstName || user.name || '' : ''}
        defaultEmail={user?.role === 'customer' ? user.email || '' : ''}
        defaultPhone={user?.role === 'customer' ? user.mobile || '' : ''}
      />
      <Link to="/products" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Catalog
      </Link>

      <div className="glass-panel p-6 md:p-10 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden shadow-lg border border-glass-border">
              <img 
                src={product.images?.[activeImage] ? `${BASE_URL}/${product.images[activeImage].replace(/\\/g, '/')}` : 'https://placehold.co/800x800/1e293b/f8fafc?text=No+Image'} 
                alt={product.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary shadow-glow' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={`${BASE_URL}/${img.replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt="thumbnail" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-surface-hover text-text-muted text-xs font-bold uppercase tracking-wider rounded-md mb-4">
                {product.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{product.title}</h1>
              <div className="flex items-end gap-4 mb-6">
                <div className="flex items-center gap-4">
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-3xl font-bold text-text-muted line-through opacity-70">Rs. {product.compareAtPrice.toFixed(2)}</span>
                  )}
                  <span className="text-4xl font-black text-success">Rs. {product.price.toFixed(2)}</span>
                </div>
                {product.stock > 0 ? (
                  <span className="text-sm text-text-muted mb-1 border border-glass-border px-3 py-1 rounded-full bg-surface">In Stock ({product.stock})</span>
                ) : (
                  <span className="text-sm text-error mb-1 border border-error/20 bg-error/10 px-3 py-1 rounded-full font-medium">Out of Stock</span>
                )}
              </div>

              {/* Trust Features */}
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-text-muted">
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-warning fill-warning" />
                  <span className="font-bold text-text">
                    {reviews.length > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length).toFixed(1) : '0.0'}
                  </span>
                  <span>({reviews.length} Reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-success">
                  <ShieldCheck size={16} />
                  <span>Verified Handcrafted</span>
                </div>
              </div>
              <div 
                className="text-lg text-text-muted leading-relaxed" 
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            </div>

            <div className="space-y-4 mb-8 pt-6 border-t border-glass-border">
              <h3 className="font-bold flex items-center gap-2"><ShieldCheck size={20} className="text-primary"/> Seller Information</h3>
              <div className="bg-surface/50 p-4 rounded-xl flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-xl shrink-0">
                  {product.sellerId?.firstName?.charAt(0) || 'S'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-lg">{product.sellerId?.businessName || `${product.sellerId?.firstName} ${product.sellerId?.lastName}`}</h4>
                    {isPremiumSeller && (
                      <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                        Premium seller
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                    <MapPin size={14} /> Verified Platform Seller
                  </p>
                  {isPremiumSeller && (
                    <p className="text-xs text-text-muted mt-2">Bulk wholesale inquiries are available for this store.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Pincode Checker */}
            <div className="mb-6 pt-4 border-t border-glass-border">
              <h3 className="font-bold mb-3 flex items-center gap-2"><MapPin size={18} /> Check Delivery Availability</h3>
              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Enter Pincode" 
                  className="input-field flex-1 max-w-[200px]" 
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  maxLength={6}
                />
                <button type="submit" className="btn btn-secondary px-6" disabled={pincodeStatus?.checking}>
                  {pincodeStatus?.checking ? 'Checking...' : 'Check'}
                </button>
              </form>
              {pincodeStatus && !pincodeStatus.checking && (
                <p className={`mt-2 text-sm font-medium ${pincodeStatus.serviceable ? 'text-success' : 'text-error'}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>

            <div className="mt-auto pt-6 border-t border-glass-border">
              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <span className="font-bold">Quantity:</span>
                <div className="flex items-center gap-3 bg-surface rounded-lg p-1 border border-glass-border">
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-muted transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || product.stock === 0}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    className="w-10 h-10 flex items-center justify-center rounded-md hover:bg-surface-hover text-text-muted transition-colors disabled:opacity-50"
                    onClick={() => setQuantity(q => Math.min(5, Math.min(product.stock, q + 1)))}
                    disabled={quantity >= 5 || quantity >= product.stock || product.stock === 0}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                {quantity === 5 && (
                  <span className="text-xs text-warning font-medium">Maximum 5 units allowed</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleAddToCart}
                  className="btn btn-primary flex-1 py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-glow" 
                  disabled={product.stock === 0}
                >
                  <ShoppingCart size={22} /> Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  className="btn bg-secondary hover:bg-secondary/90 text-white flex-1 py-4 text-lg font-bold"
                  disabled={product.stock === 0}
                >
                  Buy Now
                </button>
                {isPremiumSeller && (
                  <button
                    type="button"
                    onClick={openBulkOrder}
                    className="btn btn-secondary flex-1 py-4 text-lg font-bold flex items-center justify-center gap-2 border-2 border-warning/50 text-warning hover:bg-warning/10"
                  >
                    <Boxes size={22} /> Bulk order
                  </button>
                )}
              </div>
            </div>
            
            {/* Wishlist & Share Actions */}
            <div className="flex gap-4 mt-4">
              <button className="flex-1 btn btn-secondary py-3 flex items-center justify-center gap-2 hover:text-secondary hover:border-secondary transition-colors">
                <Heart size={20} /> Add to Wishlist
              </button>
              <button className="flex-1 btn btn-secondary py-3 flex items-center justify-center gap-2 hover:text-primary hover:border-primary transition-colors">
                <Share2 size={20} /> Share
              </button>
            </div>
            {product.stock === 0 && <p className="text-error text-sm mt-3 text-center">This product is currently out of stock.</p>}

            {/* Keywords */}
            {product.keywords && product.keywords.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {product.keywords.map(kw => (
                  <span key={kw} className="text-xs bg-surface px-3 py-1.5 rounded-full text-text-muted">#{kw}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Review Section */}
      <div className="mt-12 glass-panel p-6 md:p-10 rounded-3xl animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare size={28} className="text-primary" />
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
        </div>

        {reviews.length > 0 && (
          <div className="mb-10">
            <RatingSummary reviews={reviews} />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Write a Review Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ReviewForm 
                productId={id} 
                onReviewAdded={(newReview) => {
                  setReviews([newReview, ...reviews]);
                }} 
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-4 border-b border-glass-border">
              <h3 className="font-bold text-xl">All Reviews ({reviews.length})</h3>
              
              <div className="flex gap-4 w-full sm:w-auto">
                <select 
                  className="input-field py-2 text-sm flex-1 sm:w-40"
                  value={filterOption}
                  onChange={(e) => setFilterOption(e.target.value)}
                >
                  <option value="all">All Reviews</option>
                  <option value="5star">5 Star Only</option>
                  <option value="images">With Images</option>
                </select>
                
                <select 
                  className="input-field py-2 text-sm flex-1 sm:w-40"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-surface/50 rounded-2xl border border-dashed border-glass-border">
                <MessageSquare size={48} className="mx-auto mb-4 text-text-muted opacity-30" />
                <h3 className="text-xl font-bold mb-2">No reviews yet</h3>
                <p className="text-text-muted">Be the first to review this product!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map(review => (
                  <ReviewCard key={review._id} review={review} productId={id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
