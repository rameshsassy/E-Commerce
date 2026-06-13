import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { MessageSquare, Send, X, Shield, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LOCAL_FAQS = [
  {
    keywords: ["track", "status", "where is my order", "tracking", "delivery status"],
    question: "How do I track my order?",
    answer: "Once your order is shipped, you will receive an email and a notification in your profile with the tracking ID. You can go to Profile > Orders and click 'Track Package' to see real-time updates."
  },
  {
    keywords: ["cancel", "modify", "change order", "change address"],
    question: "Can I modify or cancel my order?",
    answer: "You can cancel your order anytime before it changes to 'Packed' or 'Shipped' status. Once shipped, you cannot cancel it, but you can request a return after delivery."
  },
  {
    keywords: ["delay", "late", "not arrived", "haven't received", "where is my delivery", "delayed"],
    question: "What should I do if my order is delayed?",
    answer: "We aim to deliver all products within 3-5 business days. If your order is delayed, please check the tracking link. If there's no update for 48 hours, raise a support ticket and we will assist you."
  },
  {
    keywords: ["payment method", "accept", "how to pay", "pay", "cod", "credit card", "upi", "razorpay", "payment option"],
    question: "What payment methods do you accept?",
    answer: "We accept all major Credit/Debit Cards, UPI, Net Banking, and Wallets through our secure Razorpay integration. We also offer Cash on Delivery (COD) in select pincodes."
  },
  {
    keywords: ["failed", "deducted", "payment failed", "refund transaction", "money cut", "transaction failed"],
    question: "My payment failed but money was deducted. What do I do?",
    answer: "Don't worry! If money was deducted during a failed transaction, it is usually automatically refunded by your bank within 5-7 business days. If you still don't receive it, please contact our support."
  },
  {
    keywords: ["secure", "safety", "card details", "encryption", "safe"],
    question: "Are my payment details secure?",
    answer: "Yes, 100%. We do not store any card details on our servers. All transactions are securely processed through industry-leading payment gateways with end-to-end encryption."
  },
  {
    keywords: ["return policy", "how to return", "refund policy", "return process", "can i return"],
    question: "What is your return policy?",
    answer: "We offer a hassle-free 7-day return policy for most products. The item must be unused, in its original packaging, and with all tags intact."
  },
  {
    keywords: ["refund take", "how long refund", "refund status", "when will i get my refund"],
    question: "How long does a refund take?",
    answer: "Once your returned item is received and inspected by the seller, your refund will be processed to the original payment method within 3-5 business days."
  },
  {
    keywords: ["return shipping", "pay for return", "shipping cost return", "is return free"],
    question: "Do I have to pay for return shipping?",
    answer: "If the product is defective or incorrect, we will cover the return shipping costs. For all other reasons, a small convenience fee may be deducted from your refund."
  },
  {
    keywords: ["international", "ship outside", "abroad", "foreign", "other countries"],
    question: "Do you ship internationally?",
    answer: "Currently, we only ship within India. We are working on expanding our logistics to international markets soon!"
  },
  {
    keywords: ["shipping charge", "delivery charge", "free delivery", "free shipping", "shipping fee", "delivery cost"],
    question: "How much are the delivery charges?",
    answer: "Standard delivery is free on orders above Rs. 999. For orders below this amount, a flat shipping fee of Rs. 50 is applied at checkout."
  },
  {
    keywords: ["update profile", "change profile", "personal information", "update details", "change email", "change phone"],
    question: "How do I update my profile details?",
    answer: "Log in to your account, go to your Profile dashboard, and navigate to the 'Personal Information' tab to update your details."
  },
  {
    keywords: ["forgot password", "reset password", "change password", "recover account"],
    question: "I forgot my password. How can I reset it?",
    answer: "Click on the 'Forgot Password' link on the login page. Enter your registered email address, and we will send you a secure link to reset your password."
  }
];

const findLocalFAQMatch = (text) => {
  const query = text.toLowerCase();
  for (const faq of LOCAL_FAQS) {
    for (const keyword of faq.keywords) {
      if (query.includes(keyword.toLowerCase())) {
        return faq;
      }
    }
  }
  return null;
};

const FloatingChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local messages list for Guest users
  const [guestMessages, setGuestMessages] = useState([]);

  const chatContainerRef = useRef(null);

  // Initialize/load conversation for logged-in users
  useEffect(() => {
    if (!user || !isOpen) return;

    const initConversation = async () => {
      setLoading(true);
      setError('');
      try {
        const type = user.role === 'seller' ? 'seller_admin' : 'customer_admin';
        const { data } = await api.post('/chat/conversations', { type });
        setConversation(data.conversation);

        // Fetch messages
        const msgRes = await api.get(`/chat/conversations/${data.conversation._id}/messages`);
        setMessages(msgRes.data.messages || []);
      } catch (err) {
        console.error('Failed to load support chat conversation', err);
        setError('Failed to connect to support chat.');
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [user, isOpen]);

  // Poll for messages in logged-in mode
  useEffect(() => {
    if (!user || !isOpen || !conversation) return;

    const pollMessages = async () => {
      try {
        const { data } = await api.get(`/chat/conversations/${conversation._id}/messages`);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to poll support messages', err);
      }
    };

    const interval = setInterval(pollMessages, 4000);
    return () => clearInterval(interval);
  }, [user, isOpen, conversation]);

  // Scroll to bottom when message count updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, guestMessages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText('');

    if (!user) {
      // Guest mode FAQ match logic
      const userMsg = {
        _id: 'guest_u_' + Date.now(),
        sender: { role: 'guest' },
        text: textToSend,
        createdAt: new Date().toISOString()
      };

      setGuestMessages(prev => [...prev, userMsg]);

      setTimeout(() => {
        const match = findLocalFAQMatch(textToSend);
        let replyText;
        if (match) {
          replyText = `Based on your question, here is what I found in our FAQ:\n\n**${match.question}**\n${match.answer}`;
        } else {
          replyText = "I couldn't find a direct answer to your question in our FAQs. Please log in or register to chat with a support representative.";
        }

        const botMsg = {
          _id: 'guest_b_' + Date.now(),
          sender: { role: 'admin', firstName: 'Support Bot' },
          text: replyText,
          createdAt: new Date().toISOString()
        };
        setGuestMessages(prev => [...prev, botMsg]);
      }, 700);

      return;
    }

    if (!conversation) return;

    try {
      // Optimistic locally appended message
      const tempUserMsg = {
        _id: 'temp_' + Date.now(),
        sender: { _id: user._id, firstName: user.name || user.firstName, role: user.role },
        text: textToSend,
        createdAt: new Date().toISOString()
      };
      setMessages(prev => [...prev, tempUserMsg]);

      const { data } = await api.post(`/chat/conversations/${conversation._id}/messages`, {
        text: textToSend
      });

      // Update with exact saved message from DB
      setMessages(prev => prev.map(m => m._id.startsWith('temp_') ? data.messageData : m));
      
      // Slight delay to fetch bot auto-reply
      setTimeout(async () => {
        try {
          const res = await api.get(`/chat/conversations/${conversation._id}/messages`);
          setMessages(res.data.messages || []);
        } catch (_err) {
          /* ignore */
        }
      }, 1200);

    } catch (err) {
      console.error('Failed to send message', err);
      setError('Message delivery failed.');
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="w-80 md:w-96 h-[480px] bg-[#1e293b]/95 backdrop-blur-md border border-white/10 rounded-3xl shadow-glow overflow-hidden mb-4 flex flex-col animate-fade-in text-white">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-none flex items-center gap-1.5">
                  Aashansh Support
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                </h4>
                <p className="text-[10px] text-indigo-200 mt-1">We typically reply within 24h</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
                {error}
              </div>
            )}

            {/* Standard Bot Welcome Message */}
            <div className="flex flex-col items-start max-w-[85%]">
              <span className="text-[9px] text-[#94a3b8] mb-1 ml-1 font-semibold uppercase tracking-wider">Support Bot</span>
              <div className="p-3 bg-white/5 border border-white/10 text-white rounded-2xl rounded-tl-none text-xs leading-relaxed">
                Hey {user ? user.name || user.firstName : 'Guest'}, how can we help you today?
              </div>
            </div>

            {/* Render guest messages or actual authenticated messages */}
            {!user ? (
              guestMessages.map((msg) => {
                const isMe = msg.sender.role === 'guest';
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[9px] text-[#94a3b8] mb-1 ml-1 font-semibold uppercase tracking-wider">
                        Support Bot
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                          : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-[#94a3b8] mt-1 mx-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                const senderName = isMe ? 'You' : (msg.sender?.firstName || 'Support Bot');
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    {!isMe && (
                      <span className="text-[9px] text-[#94a3b8] mb-1 ml-1 font-semibold uppercase tracking-wider">
                        {senderName}
                      </span>
                    )}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-tr-none font-medium'
                          : 'bg-white/5 border border-white/10 text-white rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[8px] text-[#94a3b8] mt-1 mx-1">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                );
              })
            )}

            {loading && (
              <div className="text-center text-xs text-[#94a3b8]">Connecting...</div>
            )}
          </div>

          {/* Guest Log-in prompt banner */}
          {!user && (
            <div className="px-4 py-2 bg-indigo-950/40 border-t border-b border-indigo-500/10 flex items-center justify-between text-[11px] text-indigo-300">
              <span className="flex items-center gap-1.5">
                <HelpCircle size={13} /> Want to chat with a human?
              </span>
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="font-bold hover:underline flex items-center gap-0.5 text-white bg-indigo-600 px-2 py-0.5 rounded-lg"
              >
                Log In <ArrowRight size={10} />
              </Link>
            </div>
          )}

          {/* Form Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-[#0f172a]/80 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={!user ? "Ask FAQ (e.g. returns, tracking)..." : "Type your message..."}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl text-xs py-2 px-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all focus:outline-none border-0"
        title="Need Help?"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
};

export default FloatingChat;
