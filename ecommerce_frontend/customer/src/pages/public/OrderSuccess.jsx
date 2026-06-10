import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

const OrderSuccess = () => {
  const { id } = useParams();

  useEffect(() => {
    // Add simple CSS animation class or just rely on the CheckCircle
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel max-w-lg w-full p-10 rounded-3xl text-center animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-success/20 text-success rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={48} />
        </div>
        
        <h1 className="text-3xl font-extrabold mb-2">Payment Successful!</h1>
        <p className="text-text-muted mb-8">Thank you for your purchase. Your order has been placed successfully.</p>
        
        <div className="bg-surface w-full p-4 rounded-xl border border-glass-border mb-8 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="text-text-muted text-sm">Order ID:</span>
            <span className="font-mono font-bold text-sm bg-primary/10 text-primary px-2 py-1 rounded">{id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-text-muted text-sm">Status:</span>
            <span className="text-success font-bold text-sm flex items-center gap-1"><Package size={14}/> Processing</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link to={`/profile/orders`} className="btn btn-primary flex-1 py-3 font-bold">
            Track Order
          </Link>
          <Link to="/products" className="btn btn-secondary flex-1 py-3 font-bold flex items-center justify-center gap-2">
            Continue Shopping <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
