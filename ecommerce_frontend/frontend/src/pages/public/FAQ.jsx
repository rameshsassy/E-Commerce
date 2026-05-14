import React, { useState } from 'react';
import { Search, ChevronDown, MessageCircle, Mail, HelpCircle, Package, CreditCard, RefreshCw, Truck, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQS_DATA = [
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

  // Filter logic
  const filteredData = FAQS_DATA.map(category => {
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
          {FAQS_DATA.map((cat, idx) => (
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

          {/* Still Need Help Section */}
          <div className="mt-12 bg-surface p-8 rounded-3xl border border-glass-border flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="z-10">
              <h3 className="text-2xl font-bold mb-2">Still need help?</h3>
              <p className="text-text-muted">If you couldn't find the answer to your question, our support team is ready to help.</p>
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
