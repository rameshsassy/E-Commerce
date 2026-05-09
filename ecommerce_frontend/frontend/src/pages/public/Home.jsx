import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ShieldCheck, HeartHandshake, Truck, Star, Sparkles } from 'lucide-react';
import api from '../../utils/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=8');
        setFeaturedProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  const categories = [
    { name: 'Bags', icon: '👜', color: 'bg-orange-500/10 text-orange-500' },
    { name: 'Jewellery', icon: '✨', color: 'bg-yellow-500/10 text-yellow-500' },
    { name: 'Snacks', icon: '🍪', color: 'bg-green-500/10 text-green-500' },
    { name: 'Women Hygiene', icon: '🌸', color: 'bg-pink-500/10 text-pink-500' },
    { name: 'Books', icon: '📚', color: 'bg-blue-500/10 text-blue-500' },
    { name: 'Lifestyle', icon: '🌿', color: 'bg-teal-500/10 text-teal-500' },
  ];

  return (
    <div className="flex flex-col animate-fade-in">
      
      {/* 1. HERO BANNER */}
      <section className="relative px-8 py-24 overflow-hidden flex items-center min-h-[75vh]">
        {/* Background blobs for aesthetics */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="badge badge-warning mb-6 inline-flex items-center gap-2 px-4 py-2 text-sm border border-warning/30">
            <Sparkles size={16} /> Purpose-Driven Marketplace
          </span>
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight">
            Empowering Women, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
              One Handcrafted Product
            </span><br/>
            at a Time.
          </h1>
          <p className="text-xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover premium handcrafted bags, jewellery, and organic products made by talented women artisans across the country. Support the cause and shop with purpose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/products" className="btn btn-primary text-lg px-10 py-5 rounded-full shadow-glow">
              Explore Collections <ShoppingBag size={22} />
            </Link>
            <Link to="/products?category=Handcrafted" className="btn btn-secondary text-lg px-10 py-5 rounded-full border-2 hover:border-secondary/50 transition-all">
              Shop Handcrafted 🌸
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TRUST SIGNALS */}
      <section className="py-12 border-y border-glass-border bg-surface/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex items-center justify-center gap-4 text-text-muted hover:text-primary transition-colors">
              <ShieldCheck size={32} className="text-success" />
              <div>
                <h4 className="font-bold text-text">Secure Payments</h4>
                <p className="text-xs">Powered by Razorpay</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-text-muted hover:text-primary transition-colors">
              <HeartHandshake size={32} className="text-secondary" />
              <div>
                <h4 className="font-bold text-text">Verified Sellers</h4>
                <p className="text-xs">100% Genuine Artisans</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-text-muted hover:text-primary transition-colors">
              <Truck size={32} className="text-warning" />
              <div>
                <h4 className="font-bold text-text">Easy Returns</h4>
                <p className="text-xs">7-Day Return Policy</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 text-text-muted hover:text-primary transition-colors">
              <Star size={32} className="text-primary" />
              <div>
                <h4 className="font-bold text-text">Real Reviews</h4>
                <p className="text-xs">From Verified Buyers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section className="py-24 px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold mb-4">Shop by Category</h2>
          <p className="text-text-muted text-lg">Browse our curated collections of handcrafted goods.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, idx) => (
            <Link 
              to={`/products?category=${cat.name}`} 
              key={idx}
              className="glass-panel p-8 flex flex-col items-center justify-center text-center gap-4 hover:-translate-y-2 transition-transform duration-300 hover:shadow-glow group cursor-pointer"
            >
              <div className={`w-16 h-16 rounded-2xl ${cat.color} flex items-center justify-center text-3xl group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>
              <h3 className="font-bold">{cat.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. PRODUCT SECTIONS (Featured) */}
      <section className="py-20 px-8 bg-surface/20">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-secondary font-bold tracking-wider uppercase text-sm mb-2 block">Top Picks</span>
              <h2 className="text-4xl font-extrabold">Featured Handcrafted Products</h2>
            </div>
            <Link to="/products" className="text-primary hover:text-secondary flex items-center gap-2 font-bold transition-colors">
              View All <ArrowRight size={20} />
            </Link>
          </div>

          {featuredProducts.length === 0 ? (
            <div className="text-center py-20 glass-panel">
              <p className="text-text-muted text-lg">Amazing products are on their way!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <Link to={`/product/${product._id}`} key={product._id} className="glass-panel rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-300 group flex flex-col h-full">
                  <div className="h-72 bg-surface relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <div className="w-full h-full relative">
                        <img 
                          src={`http://localhost:5000/${product.images[0].replace(/\\/g, '/')}`} 
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-surface-hover group-hover:scale-110 transition-transform duration-700">
                        <ShoppingBag size={48} className="text-text-muted opacity-50" />
                      </div>
                    )}
                    
                    {/* Tags */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="badge bg-secondary text-white shadow-md">Sale</span>
                      )}
                      <span className="badge bg-surface/80 backdrop-blur-md text-text shadow-md">Handcrafted</span>
                    </div>

                    <div className="absolute top-4 right-4 z-20">
                      <button className="w-10 h-10 rounded-full bg-surface/80 backdrop-blur-md flex items-center justify-center hover:bg-secondary hover:text-white transition-colors shadow-md" onClick={(e) => { e.preventDefault(); /* Add to wishlist logic */ }}>
                        <Heart size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-xs text-text-muted mb-2 uppercase tracking-wider">{product.category}</p>
                    <h3 className="text-lg font-bold mb-2 line-clamp-2 hover:text-primary transition-colors">{product.title}</h3>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-xs text-text-muted line-through">Rs. {product.compareAtPrice.toFixed(2)}</span>
                        )}
                        <span className="text-xl font-extrabold text-primary">Rs. {product.price.toFixed(2)}</span>
                      </div>
                      <button className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors" onClick={(e) => { e.preventDefault(); /* Add to cart logic */ }}>
                        <ShoppingBag size={20} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Seasonal Promotion Banner */}
      <section className="py-24 px-8 max-w-7xl mx-auto w-full">
        <div className="glass-panel rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center p-0 border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/80 mix-blend-multiply z-10"></div>
          
          <div className="w-full md:w-1/2 p-12 md:p-20 relative z-20">
            <span className="badge bg-white/20 text-white mb-4 backdrop-blur-md">Limited Time</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Festive Collection</h2>
            <p className="text-white/90 text-lg mb-8 max-w-md">
              Celebrate the season with exclusive handcrafted items. Get up to 30% off on selected bags and jewellery.
            </p>
            <Link to="/products?collection=festive" className="btn bg-white text-primary hover:bg-gray-100 text-lg px-8 py-4 rounded-full shadow-lg">
              Shop Festive Collection
            </Link>
          </div>
          
          <div className="w-full md:w-1/2 h-64 md:h-auto absolute md:relative right-0 top-0 bottom-0 z-0">
             <img src="https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=1000&auto=format&fit=crop" alt="Festive Items" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
