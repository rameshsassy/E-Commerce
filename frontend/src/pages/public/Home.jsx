import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ShieldCheck, Zap } from 'lucide-react';
import api from '../../utils/api';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  useEffect(() => {
    // Fetch some products for the home page
    const fetchProducts = async () => {
      try {
        const { data } = await api.get('/products?limit=4');
        setFeaturedProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex flex-col animate-fade-in">
      {/* Hero Section */}
      <section className="relative px-8 py-20 overflow-hidden flex items-center min-h-[60vh]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 z-0"></div>
        <div className="relative z-10 max-w-4xl">
          <span className="badge badge-warning mb-6 inline-block">🚀 New Collection 2026</span>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Next Generation <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              E-Commerce Experience
            </span>
          </h1>
          <p className="text-xl text-text-muted mb-10 max-w-2xl">
            Discover premium products from verified sellers. A fully authenticated, high-performance marketplace built for the modern web.
          </p>
          <div className="flex gap-4">
            <Link to="/products" className="btn btn-primary text-lg px-8 py-4 rounded-full">
              Shop Now <ShoppingBag size={20} />
            </Link>
            <Link to="/register" className="btn btn-secondary text-lg px-8 py-4 rounded-full">
              Become a Seller
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-8 bg-surface/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-6">
              <Zap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
            <p className="text-text-muted">Built with Vite and React for an incredibly smooth and responsive experience.</p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-success/20 text-success flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Sellers</h3>
            <p className="text-text-muted">Every seller undergoes strict KYC verification to ensure trust and quality.</p>
          </div>
          
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-105 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-6">
              <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-bold mb-3">Premium Quality</h3>
            <p className="text-text-muted">Products are manually approved by admins before they appear on the marketplace.</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 px-8">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Products</h2>
            <p className="text-text-muted">Handpicked arrivals from top sellers.</p>
          </div>
          <Link to="/products" className="text-primary hover:underline flex items-center gap-2 font-medium">
            View All <ArrowRight size={18} />
          </Link>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-20 glass-panel">
            <p className="text-text-muted text-lg">No products available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product._id} className="glass-panel rounded-2xl overflow-hidden hover:shadow-glow transition-all duration-300 group">
                <div className="h-64 bg-surface relative overflow-hidden group/slider">
                  {product.images && product.images.length > 0 ? (
                    <div className="w-full h-full relative">
                      <img 
                        src={`http://localhost:5000/${product.images[0].replace(/\\/g, '/')}`} 
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
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
                  <div className="absolute top-4 right-4 badge badge-success bg-white/90 backdrop-blur-md z-20">
                    ${product.price}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-1 truncate">{product.title}</h3>
                  <p className="text-sm text-text-muted mb-4 line-clamp-2">{product.description}</p>
                  <button className="btn btn-primary w-full py-2">View Details</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
