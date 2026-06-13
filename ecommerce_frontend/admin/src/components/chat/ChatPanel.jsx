import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../utils/api';
import { Send, User, MessageSquare, Shield, Star, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ChatPanel = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  
  const chatContainerRef = useRef(null);

  const isAdmin = user?.role === 'admin';

  // Select active conversation
  const handleSelectConversation = useCallback(async (convo) => {
    setActiveConversation(convo);
    setLoadingMessages(true);
    try {
      const { data } = await api.get(`/chat/conversations/${convo._id}/messages`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load messages', err);
      setError('Could not load messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Load conversations
  const fetchConversations = useCallback(async (selectFirst = false) => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
      if (selectFirst && data.conversations?.length > 0) {
        handleSelectConversation(data.conversations[0]);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
      setError('Could not load chat conversations.');
    } finally {
      setLoadingConvos(false);
    }
  }, [handleSelectConversation]);

  // Load sub-admin staff list for assignment (Admins only)
  const fetchStaff = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/admin/roles/staff');
      setStaff(data.staff || []);
    } catch (err) {
      console.error('Failed to load sub-admin staff', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchConversations(true);
    fetchStaff();

    // Poll for new messages every 5 seconds
    const interval = setInterval(() => {
      fetchConversations(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchConversations, fetchStaff]);

  // Poll for messages in active conversation
  useEffect(() => {
    if (!activeConversation) return;

    const fetchMessagesOnly = async () => {
      try {
        const { data } = await api.get(`/chat/conversations/${activeConversation._id}/messages`);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Failed to poll messages', err);
      }
    };

    fetchMessagesOnly();
    const msgInterval = setInterval(fetchMessagesOnly, 4000);

    return () => clearInterval(msgInterval);
  }, [activeConversation]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const { data } = await api.post(`/chat/conversations/${activeConversation._id}/messages`, {
        text: textToSend,
      });
      setMessages((prev) => [...prev, data.messageData]);
      
      // Update local conversation list's snippet
      setConversations((prevConvos) =>
        prevConvos.map((c) =>
          c._id === activeConversation._id
            ? { ...c, lastMessage: textToSend, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send message', err);
      setError('Failed to send message. Please try again.');
    }
  };

  const handleAssignStaff = async (staffId) => {
    if (!activeConversation || !isAdmin) return;

    try {
      const { data } = await api.post(`/chat/conversations/${activeConversation._id}/assign`, {
        staffId: staffId || null,
      });
      setActiveConversation(data.conversation);
      setConversations((prevConvos) =>
        prevConvos.map((c) => (c._id === data.conversation._id ? data.conversation : c))
      );
    } catch (err) {
      console.error('Failed to assign chat', err);
      setError('Failed to assign sub-admin.');
    }
  };

  // Helper to format timestamps
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to get partner user details for display
  const getConversationPartner = (convo) => {
    const others = convo.participants.filter((p) => p._id !== user._id);
    if (others.length === 0) return { firstName: 'You', role: 'self' };
    
    if (convo.type === 'customer_both') {
      const customer = convo.participants.find(p => p.role === 'customer');
      const seller = convo.participants.find(p => p.role === 'seller');
      return {
        firstName: `${customer?.firstName || 'Customer'} & ${seller?.businessName || 'Seller'}`,
        role: 'group',
        details: 'Admin-Seller-Customer Group Chat'
      };
    }

    const mainPartner = others[0];
    return {
      firstName: mainPartner.role === 'seller' ? mainPartner.businessName : `${mainPartner.firstName} ${mainPartner.lastName || ''}`,
      role: mainPartner.role,
      details: mainPartner.role === 'seller' ? 'Seller' : mainPartner.role === 'admin' ? 'Admin' : 'Customer',
      logo: mainPartner.organizationLogo
    };
  };

  const getRoleIcon = (roleName) => {
    switch (roleName) {
      case 'admin':
      case 'admin_staff':
        return <Shield className="text-primary shrink-0" size={16} />;
      case 'seller':
        return <Star className="text-warning shrink-0" size={16} />;
      default:
        return <User className="text-text-muted shrink-0" size={16} />;
    }
  };

  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case 'admin':
      case 'admin_staff':
        return 'bg-primary/20 text-primary border border-primary/30';
      case 'seller':
        return 'bg-warning/20 text-warning border border-warning/30';
      default:
        return 'bg-slate-400/10 text-slate-400 border border-white/10';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[75vh] w-full rounded-2xl border border-glass-border overflow-hidden bg-surface-dark/40 backdrop-blur-md shadow-glow">
      {/* Sidebar - Conversations list */}
      <div className="w-full lg:w-80 border-r border-glass-border flex flex-col bg-surface/5 shrink-0">
        <div className="p-4 border-b border-glass-border flex items-center justify-between">
          <h3 className="font-bold text-lg text-white flex items-center gap-2">
            <MessageSquare className="text-[#ffd401]" size={20} /> Chats
          </h3>
          <span className="text-xs bg-white/10 text-text-muted px-2 py-0.5 rounded-full">
            {conversations.length} Threads
          </span>
        </div>

        {error && (
          <div className="p-3 bg-error/15 border-b border-error text-error text-xs flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-glass-border/40 scrollbar-thin">
          {loadingConvos ? (
            <div className="flex items-center justify-center p-8 text-sm text-text-muted">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-text-muted">
              <MessageSquare size={32} className="mb-2 opacity-30" />
              <span>No conversations yet.</span>
            </div>
          ) : (
            conversations.map((convo) => {
              const isActive = activeConversation?._id === convo._id;
              const partner = getConversationPartner(convo);
              return (
                <button
                  key={convo._id}
                  onClick={() => handleSelectConversation(convo)}
                  className={`w-full text-left p-4 transition-colors flex items-start gap-3 hover:bg-surface-hover ${
                    isActive ? 'bg-surface-hover/80 border-l-4 border-[#ffd401]' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#ffd401]/10 flex items-center justify-center shrink-0 border border-[#ffd401]/20 overflow-hidden">
                    {partner.logo ? (
                      <img src={partner.logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-[#ffd401]" size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="font-bold text-sm text-white truncate pr-1">
                        {partner.firstName}
                      </span>
                      <span className="text-[10px] text-text-muted shrink-0 flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(convo.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted truncate mb-1">
                      {convo.lastMessage || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${getRoleBadgeClass(partner.role)}`}>
                        {partner.details || convo.type.replace('_', ' ')}
                      </span>
                      {convo.assignedTo && (
                        <span className="text-[9px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-1.5 py-0.2 rounded">
                          Assigned
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-surface/2 backdrop-blur-sm">
        {activeConversation ? (
          <>
            {/* Active chat header */}
            <div className="p-4 border-b border-glass-border bg-surface/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#ffd401]/10 flex items-center justify-center border border-[#ffd401]/25">
                  <User className="text-[#ffd401]" size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    {getConversationPartner(activeConversation).firstName}
                    {getRoleIcon(getConversationPartner(activeConversation).role)}
                  </h4>
                  <p className="text-[10px] text-text-muted">
                    {getConversationPartner(activeConversation).details} • Chat ID: {activeConversation._id.slice(-6)}
                  </p>
                </div>
              </div>

              {/* Assignment controls for admin */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted hidden md:inline">Assign to:</span>
                  <select
                    value={activeConversation.assignedTo?._id || ''}
                    onChange={(e) => handleAssignStaff(e.target.value)}
                    className="input-field py-1 px-3 text-xs bg-surface border border-glass-border rounded-lg text-white"
                  >
                    <option value="">Unassigned (Open)</option>
                    {staff.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.firstName} ({s.adminAccessLevel || 'limited'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* For sub-admins, display assigned notice */}
              {!isAdmin && activeConversation.assignedTo && (
                <div className="text-[10px] bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Shield size={12} /> Assigned to you
                </div>
              )}
            </div>

            {/* Message List */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-sm text-text-muted">
                  Loading chat history...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-text-muted">
                  <MessageSquare size={40} className="mb-2 opacity-20 animate-bounce" />
                  <span>Send a message to start conversation.</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender?._id === user._id || msg.sender === user._id;
                  const senderName = msg.sender?.role === 'seller' 
                    ? msg.sender.businessName 
                    : `${msg.sender?.firstName || 'User'} ${msg.sender?.lastName || ''}`;

                  return (
                    <div
                      key={msg._id}
                      className={`flex flex-col max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      {!isMe && (
                        <span className="text-[10px] text-text-muted mb-1 ml-1 flex items-center gap-1">
                          {senderName}
                          <span className="opacity-60">({msg.sender?.role || 'user'})</span>
                        </span>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-sm leading-relaxed ${
                          isMe
                            ? 'bg-[#ffd401] text-black font-semibold rounded-tr-none'
                            : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[8px] text-text-muted mt-1 mr-1 ml-1">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-glass-border bg-surface/5 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="input-field flex-1 bg-surface border border-glass-border rounded-xl text-sm py-2.5 px-4 text-white focus:border-[#ffd401] focus:ring-1 focus:ring-[#ffd401] placeholder-white/40"
              />
              <button
                type="submit"
                className="h-11 w-11 shrink-0 rounded-xl bg-[#ffd401] hover:bg-[#e6be00] text-black flex items-center justify-center transition-transform active:scale-95 border-0 shadow-glow"
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-text-muted">
            <MessageSquare size={64} className="mb-4 text-[#ffd401] opacity-35 animate-pulse" />
            <h3 className="text-xl font-bold text-white mb-2">No conversation selected</h3>
            <p className="text-sm max-w-sm">
              Please choose a chat conversation from the sidebar list, or start a new support request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;
