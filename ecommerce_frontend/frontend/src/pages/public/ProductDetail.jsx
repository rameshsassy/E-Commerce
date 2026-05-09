import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, ShieldCheck, MapPin, Package, Heart, Share2, Star } from 'lucide-react';
import api from '../../utils/api';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

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

  return (
    <div className="p-4 md:p-8 animate-fade-in max-w-6xl mx-auto w-full">
      <Link to="/products" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Catalog
      </Link>

      <div className="glass-panel p-6 md:p-10 rounded-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden shadow-lg border border-glass-border">
              <img 
                src={product.images?.[activeImage] ? `http://localhost:5000/${product.images[activeImage].replace(/\\/g, '/')}` : 'https://placehold.co/800x800/1e293b/f8fafc?text=No+Image'} 
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
                    <img src={`http://localhost:5000/${img.replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt="thumbnail" />
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
                  <span className="font-bold text-text">4.8</span>
                  <span>(124 Reviews)</span>
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
                <div>
                  <h4 className="font-bold text-lg">{product.sellerId?.businessName || `${product.sellerId?.firstName} ${product.sellerId?.lastName}`}</h4>
                  <p className="text-sm text-text-muted flex items-center gap-1 mt-1">
                    <MapPin size={14} /> Verified Platform Seller
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col sm:flex-row gap-4 pt-6 border-t border-glass-border">
              <button className="btn btn-primary flex-1 py-4 text-lg font-bold flex items-center justify-center gap-2 shadow-glow" disabled={product.stock === 0}>
                <ShoppingCart size={22} /> Add to Cart
              </button>
              <button className="btn bg-secondary hover:bg-secondary/90 text-white flex-1 py-4 text-lg font-bold">
                Buy Now
              </button>
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
    </div>
  );
};

export default ProductDetail;
