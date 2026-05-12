import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { CheckCircle, Zap, ShieldCheck } from 'lucide-react';

const SellerSubscription = () => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  // For UI testing purposes, assume user might have `subscriptionActive`
  const isPremium = user?.sellerType === 'premium' && user?.subscriptionActive;

  const navigate = useNavigate();

  const handleUpgrade = async () => {
    setProcessing(true);
    try {
      // 1. Create Razorpay Subscription Order (Backend)
      const { data: rzpOrder } = await api.post('/seller/subscription/razorpay');

      // 2. Initialize Razorpay Checkout
      const options = {
        key: 'rzp_test_12345', // Replace with your key
        amount: rzpOrder.amount, // ₹10,767.50 in paise
        currency: rzpOrder.currency,
        name: 'AASHANSH',
        description: 'Premium Seller Subscription',
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment with backend
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            };

            await api.post('/seller/subscription/razorpay/verify', verifyPayload);
            
            alert('Welcome to Aashansh Premium! Your account has been upgraded.');
            // Redirect to premium seller page
            navigate('/seller/premium');
          } catch (err) {
            console.error('Verification failed', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.firstName || 'Seller',
          email: user?.email,
          contact: user?.mobile,
        },
        theme: {
          color: '#6366f1' // primary color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
        alert(response.error.description);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error', err);
      alert('Failed to initialize payment.');
      setProcessing(false);
    }
  };

  const handleTestUpgrade = async () => {
    setProcessing(true);
    try {
      await api.post('/seller/upgrade');
      alert('Test upgrade: You are now a Premium Seller!');
      navigate('/seller/premium');
    } catch (err) {
      console.error('Test upgrade failed', err);
      alert('Upgrade failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 animate-fade-in w-full max-w-5xl mx-auto">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <Zap className="text-warning fill-warning/20" size={32} /> 
        Seller Subscription Plans
      </h1>

      {isPremium ? (
        <div className="glass-panel p-8 rounded-3xl border border-success/30 bg-success/5 flex flex-col items-center justify-center text-center">
          <ShieldCheck size={64} className="text-success mb-4" />
          <h2 className="text-2xl font-bold text-success mb-2">You are a Premium Seller!</h2>
          <p className="text-text-muted mb-6">Your bulk purchase feature is enabled and your account is active.</p>
          <div className="flex flex-col gap-2 max-w-md w-full bg-surface p-4 rounded-xl text-left border border-glass-border">
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Bulk Purchase Option Enabled</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Priority Customer Support</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-primary" /> Reduced Commission Rates</div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Free Plan */}
          <div className="glass-panel p-8 rounded-3xl border border-glass-border flex flex-col opacity-80">
            <h2 className="text-xl font-bold mb-2">Standard Seller</h2>
            <div className="text-3xl font-black mb-6">Free</div>
            
            <div className="flex-1 flex flex-col gap-4 text-text-muted text-sm">
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Unlimited standard product uploads</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Standard seller dashboard</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-success" /> Basic analytics</div>
              <div className="flex items-center gap-2 opacity-50"><CheckCircle size={16} className="text-error" /> No bulk purchase inquiries</div>
              <div className="flex items-center gap-2 opacity-50"><CheckCircle size={16} className="text-error" /> No B2B lead generation</div>
            </div>
            
            <button className="btn w-full mt-8 py-3 bg-surface text-text-muted cursor-not-allowed font-medium rounded-xl border border-glass-border">
              Current Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="glass-panel p-8 rounded-3xl border-2 border-primary relative overflow-hidden flex flex-col shadow-glow">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs font-black uppercase tracking-wider py-1 px-8 rotate-45 translate-x-6 translate-y-4 shadow-lg">
              Recommended
            </div>
            
            <h2 className="text-xl font-bold mb-2 text-primary">Premium Seller</h2>
            <div className="flex items-end gap-2 mb-6">
              <div className="text-4xl font-black">₹9,125</div>
              <div className="text-text-muted text-sm pb-1">/ year (+ 18% GST)</div>
            </div>
            
            <div className="flex-1 flex flex-col gap-4 text-sm mb-8">
              <div className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-primary" /> Enable "Bulk Purchase" option on products</div>
              <div className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-primary" /> Receive direct B2B wholesale inquiries</div>
              <div className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-primary" /> Private price negotiation chat</div>
              <div className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-primary" /> Custom quantity and shipping terms</div>
              <div className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-primary" /> Dedicated account manager</div>
            </div>
            
            <div className="bg-surface/50 p-4 rounded-xl border border-primary/20 mb-6 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Base Price</span>
                <span>₹9,125.00</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>GST (18%)</span>
                <span>₹1,642.50</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-primary/20 mt-2">
                <span>Total</span>
                <span>₹10,767.50</span>
              </div>
            </div>

            <button 
              disabled={processing}
              onClick={handleUpgrade}
              className="btn-primary w-full py-3 font-bold rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {processing ? 'Processing...' : 'Upgrade to Premium'}
            </button>
            <p className="text-xs text-center text-text-muted mt-4 flex items-center justify-center gap-1">
              <ShieldCheck size={14}/> Secure Encrypted Payment via Razorpay
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerSubscription;
