import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, MessageCircle, HelpCircle, Package, CreditCard, RefreshCw, Truck, User, Send, CheckCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

// Fallback local FAQs (shown if API returns empty)
const LOCAL_FAQS_DATA = [
  {
    category: "Orders",
    icon: <Package size={24} className="text-primary" />,
    items: [
      { question: "How do I track my order?", answer: "Once your order is shipped, you will receive an email and a notification in your profile with the tracking ID. You can go to Profile > Orders and click 'Track Package' to see real-time updates." },
      { question: "Can I modify or cancel my order?", answer: "You can cancel your order anytime before it changes to 'Packed' or 'Shipped' status. Once shipped, you cannot cancel it, but you can request a return after delivery." },
      { question: "What should I do if my order is delayed?", answer: "We aim to deliver all products within 3-5 business days. If your order is delayed, please check the tracking link. If there's no update for 48 hours, raise a support ticket and we will assist you." }
    ]
  },
  {
    category: "Payments",
    icon: <CreditCard size={24} className="text-primary" />,
    items: [
      { question: "What payment methods do you accept?", answer: "We accept all major Credit/Debit Cards, UPI, Net Banking, and Wallets through our secure Razorpay integration. We also offer Cash on Delivery (COD) in select pincodes." },
      { question: "My payment failed but money was deducted. What do I do?", answer: "Don't worry! If money was deducted during a failed transaction, it is usually automatically refunded by your bank within 5-7 business days. If you still don't receive it, please contact our support." },
      { question: "Are my payment details secure?", answer: "Yes, 100%. We do not store any card details on our servers. All transactions are securely processed through industry-leading payment gateways with end-to-end encryption." }
    ]
  },
  {
    category: "Returns & Refunds",
    icon: <RefreshCw size={24} className="text-primary" />,
    items: [
      { question: "What is your return policy?", answer: "We offer a hassle-free 7-day return policy for most products. The item must be unused, in its original packaging, and with all tags intact." },
      { question: "How long does a refund take?", answer: "Once your returned item is received and inspected by the seller, your refund will be processed to the original payment method within 3-5 business days." },
      { question: "Do I have to pay for return shipping?", answer: "If the product is defective or incorrect, we will cover the return shipping costs. For all other reasons, a small convenience fee may be deducted from your refund." }
    ]
  },
  {
    category: "Shipping",
    icon: <Truck size={24} className="text-primary" />,
    items: [
      { question: "Do you ship internationally?", answer: "Currently, we only ship within India. We are working on expanding our logistics to international markets soon!" },
      { question: "How much are the delivery charges?", answer: "Standard delivery is free on orders above Rs. 999. For orders below this amount, a flat shipping fee of Rs. 50 is applied at checkout." }
    ]
  },
  {
    category: "Account",
    icon: <User size={24} className="text-primary" />,
    items: [
      { question: "How do I update my profile details?", answer: "Log in to your account, go to your Profile dashboard, and navigate to the 'Personal Information' tab to update your details." },
      { question: "I forgot my password. How can I reset it?", answer: "Click on the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you a secure link to reset your password." }
    ]
  }
];

const FAQ = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategory, setOpenCategory] = useState("Orders");
  const [openItem, setOpenItem] = useState("How do I track my order?");
  const [apiFaqs, setApiFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    userType: 'Seller',
    subject: '',
    question: '',
  });

  // Fetch FAQs from API
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await api.get('/faqs');
        setApiFaqs(res.data || []);
      } catch {
        setApiFaqs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  // Build combined FAQ data: API FAQs as "General" + local fallback categories
  const combinedData = React.useMemo(() => {
    const result = [];
    if (apiFaqs.length > 0) {
      result.push({
        category: "General",
        icon: <HelpCircle size={24} className="text-primary" />,
        items: apiFaqs.map(f => ({ question: f.question, answer: f.answer })),
      });
    }
    return [...result, ...LOCAL_FAQS_DATA];
  }, [apiFaqs]);

  // Set default open category once loaded
  useEffect(() => {
    if (!loading && combinedData.length > 0) {
      const firstCat = combinedData[0].category;
      setOpenCategory(firstCat);
      if (combinedData[0].items.length > 0) {
        setOpenItem(combinedData[0].items[0].question);
      }
    }
  }, [loading, combinedData]);

  // Filter logic
  const filteredData = combinedData.map(category => {
    const filteredItems = category.items.filter(item => 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...category, items: filteredItems };
  }).filter(category => category.items.length > 0);

  const toggleItem = (question, categoryName) => {
    setOpenCategory(categoryName);
    setOpenItem(openItem === question ? null : question);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name || !form.email || !form.subject || !form.question) {
      setFormError('Please fill in all fields.');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/faqs/request', form);
      setFormSubmitted(true);
      setForm({ name: '', email: '', userType: 'Seller', subject: '', question: '' });
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to submit question. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full p-8 flex justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto w-full p-4 md:p-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="text-center py-12 mb-8 bg-surface border border-glass-border rounded-3xl overflow-hidden relative shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl mx-auto px-4">
          <HelpCircle size={48} className="mx-auto text-primary mb-6 animate-float" />
          <h1 className="text-4xl md:text-5xl font-black mb-4">How can we help?</h1>
          <p className="text-text-muted text-lg mb-8">Search our knowledge base or browse categories below to find answers to your questions.</p>
          
          <div className="relative max-w-xl mx-auto group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search for answers (e.g. tracking, refunds, password)" 
              className="w-full bg-white/5 border-2 border-glass-border pl-12 pr-4 py-4 rounded-2xl focus:border-primary focus:bg-white/10 transition-all text-text shadow-inner outline-none font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Categories */}
        <div className="md:col-span-1 flex flex-col gap-2">
          <h3 className="font-bold text-sm uppercase tracking-wider text-text-muted mb-2 px-4">Categories</h3>
          {combinedData.map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOpenCategory(cat.category);
                setSearchQuery('');
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-left ${
                openCategory === cat.category && !searchQuery
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-text-muted hover:bg-surface hover:text-text'
              }`}
            >
              {React.cloneElement(cat.icon, { 
                size: 20, 
                className: openCategory === cat.category && !searchQuery ? 'text-white' : 'text-primary' 
              })}
              {cat.category}
            </button>
          ))}
        </div>

        {/* FAQ Content */}
        <div className="md:col-span-3">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-glass-border">
              <Search size={48} className="mx-auto mb-4 text-text-muted opacity-30" />
              <h3 className="text-xl font-bold mb-2">No results found</h3>
              <p className="text-text-muted">We couldn't find any articles matching "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')} 
                className="btn btn-secondary mt-4"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredData.map((category, idx) => {
                // If not searching, only show the active category
                if (!searchQuery && category.category !== openCategory) return null;

                return (
                  <div key={idx} className="animate-fade-in">
                    {searchQuery && (
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2 pb-2 border-b border-glass-border">
                        {category.icon} {category.category}
                      </h2>
                    )}
                    
                    <div className="space-y-4">
                      {category.items.map((item, itemIdx) => {
                        const isOpen = openItem === item.question;
                        return (
                          <div 
                            key={itemIdx} 
                            className={`glass-panel border overflow-hidden transition-all duration-300 rounded-2xl ${isOpen ? 'border-primary shadow-glow' : 'border-glass-border hover:border-text-muted/30'}`}
                          >
                            <button
                              className="w-full text-left px-6 py-5 flex justify-between items-center font-bold gap-4 focus:outline-none"
                              onClick={() => toggleItem(item.question, category.category)}
                            >
                              <span className="text-lg">{item.question}</span>
                              <ChevronDown 
                                className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-text-muted'}`} 
                                size={20} 
                              />
                            </button>
                            
                            <div 
                              className={`px-6 text-text-muted leading-relaxed overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 pb-0 opacity-0'}`}
                            >
                              <div className="pt-2 border-t border-glass-border">
                                {item.answer}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Still Have a Question? — Submission Form */}
          <div className="mt-12 bg-surface p-8 rounded-3xl border border-glass-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Send size={24} className="text-primary" />
                <div>
                  <h3 className="text-2xl font-bold">Still have a question?</h3>
                  <p className="text-text-muted text-sm">Submit your question and our team will get back to you.</p>
                </div>
              </div>

              {formSubmitted ? (
                <div className="rounded-2xl bg-success/10 border border-success/30 p-8 text-center">
                  <CheckCircle size={40} className="mx-auto mb-3 text-success" />
                  <p className="font-bold text-lg mb-1">Question submitted successfully!</p>
                  <p className="text-text-muted">Our team will review it and publish an answer soon.</p>
                  <button onClick={() => setFormSubmitted(false)} className="btn btn-secondary mt-4">
                    Ask another question
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  {formError && (
                    <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-3 text-error text-sm font-medium">
                      {formError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Name *</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Email *</label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1.5">I am a *</label>
                      <select
                        value={form.userType}
                        onChange={(e) => setForm(p => ({ ...p, userType: e.target.value }))}
                        className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
                      >
                        <option value="Customer">Customer</option>
                        <option value="Seller">Seller</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1.5">Subject *</label>
                      <input
                        type="text"
                        placeholder="Brief subject"
                        value={form.subject}
                        onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))}
                        className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1.5">Your Question *</label>
                    <textarea
                      rows={4}
                      placeholder="Describe your question in detail..."
                      value={form.question}
                      onChange={(e) => setForm(p => ({ ...p, question: e.target.value }))}
                      className="w-full bg-white/5 border-2 border-glass-border px-4 py-3 rounded-xl focus:border-primary transition-all outline-none font-medium resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn btn-primary flex items-center gap-2 px-8"
                  >
                    {formLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Submit Question
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-8 bg-surface p-8 rounded-3xl border border-glass-border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="z-10">
              <h3 className="text-2xl font-bold mb-2">Need direct support?</h3>
              <p className="text-text-muted">Our support team is ready to help with any issue.</p>
            </div>
            
            <div className="flex gap-4 z-10 shrink-0">
              <Link to="/support" className="btn btn-primary flex items-center gap-2 px-6">
                <MessageCircle size={18} /> Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FAQ;
