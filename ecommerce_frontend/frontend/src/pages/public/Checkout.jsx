import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';

const Checkout = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('new');
  
  const [address, setAddress] = useState({
    fullName: '', phone: '', addressLine1: '', city: '', state: '', pinCode: ''
  });
  
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const cartRes = await api.get('/customer/cart');
        setCartData(cartRes.data);
        
        // Try loading saved addresses
        const addrRes = await api.get('/customer/address');
        if (addrRes.data && addrRes.data.length > 0) {
          setSavedAddresses(addrRes.data);
          const defAddr = addrRes.data.find(a => a.isDefault) || addrRes.data[0];
          setSelectedAddressId(defAddr._id);
          setAddress({
            fullName: defAddr.fullName,
            phone: defAddr.phone,
            addressLine1: defAddr.addressLine1,
            city: defAddr.city,
            state: defAddr.state,
            pinCode: defAddr.pinCode
          });
        }
      } catch (err) {
        console.error('Error loading checkout data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSelectSavedAddress = (id) => {
    setSelectedAddressId(id);
    if (id === 'new') {
      setAddress({ fullName: '', phone: '', addressLine1: '', city: '', state: '', pinCode: '' });
    } else {
      const addr = savedAddresses.find(a => a._id === id);
      if (addr) {
        setAddress({
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          city: addr.city,
          state: addr.state,
          pinCode: addr.pinCode
        });
      }
    }
  };

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    
    // Save address if it's a new one before proceeding
    if (selectedAddressId === 'new') {
      try {
        await api.post('/customer/address', { ...address, isDefault: savedAddresses.length === 0 });
      } catch (err) {
        console.error("Failed to save new address during checkout", err);
      }
    }
    
    setStep(2);
  };

  const calculateSubtotal = () => {
    if (!cartData || !cartData.items) return 0;
    return cartData.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const subtotal = calculateSubtotal();
  const shipping = subtotal > 999 ? 0 : 50;
  const total = subtotal + shipping;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      // 1. Create Razorpay Order
      const { data: rzpOrder } = await api.post('/customer/order/razorpay', { amount: total, shippingAddress: address });

      // 2. Initialize Razorpay Checkout
      const options = {
        key: 'rzp_test_12345', // Replace with your key
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'AASHANSH',
        description: 'Multi-vendor Marketplace',
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            // 3. Create the actual order in DB
            const orderPayload = {
              shippingAddress: address,
              paymentMethod: paymentMethod,
              itemsPrice: subtotal,
              taxPrice: 0,
              shippingPrice: shipping,
              totalAmount: total,
            };
            
            const { data: createdOrder } = await api.post('/customer/order', orderPayload);

            // 4. Verify Payment with backend
            const verifyPayload = {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: createdOrder._id
            };

            await api.post('/customer/order/razorpay/verify', verifyPayload);
            
            // Navigate to success
            navigate(`/order-success/${createdOrder._id}`);
          } catch (err) {
            console.error('Verification failed', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: address.fullName,
          contact: address.phone,
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
      alert(err.response?.data?.message || 'Failed to initialize payment.');
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex-1 flex justify-center items-center"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  if (!cartData || cartData.items.length === 0) return <div className="p-8 text-center"><h2 className="text-xl">Your cart is empty</h2></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 animate-fade-in w-full">
      
      {/* Left side: Flow */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Progress Steps */}
        <div className="flex items-center text-sm font-medium text-text-muted mb-4">
          <span className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : ''}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${step >= 1 ? 'bg-primary text-white' : 'bg-surface'}`}>1</span>
            Address
          </span>
          <div className={`h-1 flex-1 mx-4 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-surface'}`}></div>
          <span className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : ''}`}>
            <span className={`w-6 h-6 flex items-center justify-center rounded-full ${step >= 2 ? 'bg-primary text-white' : 'bg-surface'}`}>2</span>
            Payment
          </span>
        </div>

        {step === 1 && (
          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Truck size={20}/> Shipping Address</h2>
            
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-sm mb-3 text-text-muted">Select Saved Address:</h3>
                <div className="flex flex-col gap-3">
                  {savedAddresses.map(addr => (
                    <label key={addr._id} className={`p-4 border rounded-xl cursor-pointer flex gap-3 transition-all ${selectedAddressId === addr._id ? 'border-primary bg-primary/5' : 'border-glass-border hover:bg-surface-hover'}`}>
                      <input 
                        type="radio" 
                        name="addressSelection" 
                        checked={selectedAddressId === addr._id} 
                        onChange={() => handleSelectSavedAddress(addr._id)}
                        className="mt-1 accent-primary" 
                      />
                      <div>
                        <p className="font-bold">{addr.fullName} {addr.isDefault && <span className="ml-2 badge bg-primary/20 text-primary text-[10px]">Default</span>}</p>
                        <p className="text-sm text-text-muted">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.pinCode}</p>
                        <p className="text-sm text-text-muted">Phone: {addr.phone}</p>
                      </div>
                    </label>
                  ))}
                  
                  <label className={`p-4 border rounded-xl cursor-pointer flex gap-3 transition-all ${selectedAddressId === 'new' ? 'border-primary bg-primary/5' : 'border-glass-border hover:bg-surface-hover'}`}>
                    <input 
                      type="radio" 
                      name="addressSelection" 
                      checked={selectedAddressId === 'new'} 
                      onChange={() => handleSelectSavedAddress('new')}
                      className="mt-1 accent-primary" 
                    />
                    <div className="font-bold">Add New Address</div>
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Full Name</label>
                <input type="text" name="fullName" required className="input-field disabled:opacity-50" value={address.fullName} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Phone Number</label>
                <input type="text" name="phone" required className="input-field disabled:opacity-50" value={address.phone} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Address Line 1</label>
                <input type="text" name="addressLine1" required className="input-field disabled:opacity-50" value={address.addressLine1} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div>
                <label className="block text-sm mb-1">City</label>
                <input type="text" name="city" required className="input-field disabled:opacity-50" value={address.city} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div>
                <label className="block text-sm mb-1">State</label>
                <input type="text" name="state" required className="input-field disabled:opacity-50" value={address.state} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div>
                <label className="block text-sm mb-1">PIN Code</label>
                <input type="text" name="pinCode" required className="input-field disabled:opacity-50" value={address.pinCode} onChange={handleAddressChange} disabled={selectedAddressId !== 'new'} />
              </div>
              <div className="md:col-span-2 mt-4">
                <button type="submit" className="btn btn-primary w-full py-3 text-lg">Continue to Payment</button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center pb-4 border-b border-glass-border">
              <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard size={20}/> Payment Method</h2>
              <button onClick={() => setStep(1)} className="text-sm text-primary hover:underline">Edit Address</button>
            </div>
            
            <div className="bg-surface border border-primary/30 p-4 rounded-xl flex items-center justify-between cursor-pointer shadow-glow">
              <div className="flex items-center gap-3">
                <input type="radio" checked readOnly className="w-5 h-5 accent-primary" />
                <div>
                  <h4 className="font-bold text-text">Razorpay Secure Checkout</h4>
                  <p className="text-xs text-text-muted">UPI, Cards, NetBanking, Wallets</p>
                </div>
              </div>
              <ShieldCheck className="text-success" size={24} />
            </div>

            <button 
              className="btn btn-primary w-full py-4 text-lg font-bold mt-4 shadow-glow"
              onClick={handlePayment}
              disabled={processing}
            >
              {processing ? 'Processing...' : `Pay Rs. ${total.toFixed(2)} Securely`}
            </button>
            <p className="text-xs text-center text-text-muted flex items-center justify-center gap-1">
              <ShieldCheck size={14}/> Secure Encrypted Payment via Razorpay
            </p>
          </div>
        )}
      </div>

      {/* Right side: Summary */}
      <div className="w-full md:w-96 glass-panel p-6 rounded-2xl h-fit sticky top-24 shrink-0">
        <h2 className="text-xl font-bold mb-6 pb-4 border-b border-glass-border">Order Summary</h2>
        <div className="flex flex-col gap-4 mb-6 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
          {cartData.items.map(item => (
            <div key={item.product._id} className="flex gap-3 text-sm">
              <div className="w-12 h-12 bg-surface rounded overflow-hidden shrink-0 border border-glass-border">
                <img src={`${BASE_URL}/${item.product.images[0].replace(/\\/g, '/')}`} className="w-full h-full object-cover" alt={item.product.title} />
              </div>
              <div className="flex-1">
                <p className="font-bold line-clamp-1">{item.product.title}</p>
                <p className="text-text-muted text-[10px] uppercase font-bold tracking-wider mb-1">
                  Sold by: {item.product.seller?.businessName || item.product.seller?.firstName || 'Aashansh Assured'}
                </p>
                <p className="text-text-muted text-xs">Qty: {item.quantity}</p>
              </div>
              <div className="font-bold text-success">Rs. {(item.product.price * item.quantity).toFixed(2)}</div>
            </div>
          ))}
        </div>
        
        <div className="space-y-3 pt-4 border-t border-glass-border text-sm">
          <div className="flex justify-between text-text-muted">
            <span>Subtotal</span>
            <span>Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Shipping</span>
            <span>{shipping === 0 ? <span className="text-success font-bold">FREE</span> : `Rs. ${shipping.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 border-t border-glass-border mt-2">
            <span>Total Payable</span>
            <span className="text-success">Rs. {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
