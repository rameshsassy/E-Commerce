import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCcw, ShoppingBag } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="glass-panel max-w-lg w-full p-10 rounded-3xl text-center animate-fade-in flex flex-col items-center">
        <div className="w-24 h-24 bg-error/20 text-error rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
          <AlertTriangle size={48} />
        </div>
        
        <h1 className="text-3xl font-extrabold mb-2 text-error">Payment Failed</h1>
        <p className="text-text-muted mb-8">
          We couldn't process your payment. This might be due to a network issue, insufficient funds, or a bank decline. 
          Your cart items have been saved.
        </p>
        
        <div className="bg-surface w-full p-4 rounded-xl border border-glass-border mb-8 text-left">
          <p className="text-sm text-text-muted mb-2 font-bold">Suggestions:</p>
          <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
            <li>Verify your card/UPI details and try again.</li>
            <li>Try using a different payment method.</li>
            <li>Check your internet connection.</li>
          </ul>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <button onClick={() => navigate('/checkout')} className="btn btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2">
            <RefreshCcw size={18} /> Retry Payment
          </button>
          <button onClick={() => navigate('/cart')} className="btn btn-secondary flex-1 py-3 font-bold flex items-center justify-center gap-2">
            <ShoppingBag size={18} /> View Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
