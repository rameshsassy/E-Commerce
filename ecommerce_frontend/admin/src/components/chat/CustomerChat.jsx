import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import ChatPanel from './ChatPanel';
import { MessageSquare, Shield, Star, Award, Plus, X } from 'lucide-react';

const CustomerChat = () => {
  const [sellers, setSellers] = useState([]);
  const [showStartPanel, setShowStartPanel] = useState(false);
  const [chatType, setChatType] = useState('admin'); // 'admin', 'seller', 'both'
  const [selectedSeller, setSelectedSeller] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSellers = async () => {
    try {
      const { data } = await api.get('/chat/sellers');
      setSellers(data.sellers || []);
      if (data.sellers?.length > 0) {
        setSelectedSeller(data.sellers[0]._id);
      }
    } catch (err) {
      console.error('Failed to load sellers list for chat', err);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleStartChat = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    let type = 'customer_admin';
    if (chatType === 'seller') type = 'customer_seller';
    if (chatType === 'both') type = 'customer_both';

    if ((chatType === 'seller' || chatType === 'both') && !selectedSeller) {
      setError('Please select a seller to start the chat.');
      setLoading(false);
      return;
    }

    try {
      await api.post('/chat/conversations', {
        type,
        sellerId: chatType !== 'admin' ? selectedSeller : undefined,
      });
      setSuccess('Chat initialized successfully!');
      setShowStartPanel(false);
      // Refresh to reload ChatPanel lists
      window.location.reload();
    } catch (err) {
      console.error('Failed to start conversation', err);
      setError(err.response?.data?.message || 'Could not start conversation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-glass-border">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="text-primary" /> Support Center &amp; Chats
          </h2>
          <p className="text-text-muted text-sm mt-1">
            Initiate support tickets, chat with platform administrators, or ask sellers about your orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowStartPanel(true)}
          className="btn btn-primary text-sm px-4 py-2.5 flex items-center gap-1.5"
        >
          <Plus size={16} /> Start Support Ticket
        </button>
      </div>

      {showStartPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-surface border border-glass-border p-6 rounded-2xl w-full max-w-md shadow-glow relative">
            <button
              onClick={() => setShowStartPanel(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold mb-4">Start a Support Chat</h3>
            <form onSubmit={handleStartChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Who do you want to chat with?</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChatType('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      chatType === 'admin'
                        ? 'border-primary bg-primary/10 text-white'
                        : 'border-glass-border hover:border-primary/50 text-text-muted'
                    }`}
                  >
                    <Shield size={16} />
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatType('seller')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      chatType === 'seller'
                        ? 'border-warning bg-warning/10 text-white'
                        : 'border-glass-border hover:border-warning/50 text-text-muted'
                    }`}
                  >
                    <Star size={16} />
                    Seller
                  </button>
                  <button
                    type="button"
                    onClick={() => setChatType('both')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      chatType === 'both'
                        ? 'border-success bg-success/10 text-white'
                        : 'border-glass-border hover:border-success/50 text-text-muted'
                    }`}
                  >
                    <Award size={16} />
                    Both
                  </button>
                </div>
              </div>

              {(chatType === 'seller' || chatType === 'both') && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Select Seller</label>
                  {sellers.length === 0 ? (
                    <p className="text-xs text-error">No active sellers available right now.</p>
                  ) : (
                    <select
                      value={selectedSeller}
                      onChange={(e) => setSelectedSeller(e.target.value)}
                      className="input-field w-full text-sm bg-surface border border-glass-border rounded-xl text-white"
                      required
                    >
                      {sellers.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.businessName || `${s.firstName} ${s.lastName}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {error && <div className="text-xs text-error bg-error/10 p-2.5 rounded-lg">{error}</div>}
              {success && <div className="text-xs text-success bg-success/10 p-2.5 rounded-lg">{success}</div>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartPanel(false)}
                  className="btn btn-secondary flex-1 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 py-2 text-sm"
                >
                  {loading ? 'Starting...' : 'Start Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ChatPanel role="customer" />
    </div>
  );
};

export default CustomerChat;
