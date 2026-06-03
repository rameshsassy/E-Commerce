import React, { useRef, useState } from 'react';
import ChatPanel from '../../components/chat/ChatPanel';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import api from '../../utils/api';

const SellerChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatPanelRef = useRef();

  const handleStartAdminChat = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/chat/conversations', {
        type: 'seller_admin',
      });
      // Force reload the ChatPanel by reloading window or resetting state
      window.location.reload();
    } catch (err) {
      console.error('Failed to start chat with admin', err);
      setError('Could not initiate chat with admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-2">
            <MessageSquare size={28} className="text-[#ffd401]" /> Message Center
          </h1>
          <p className="text-text-muted text-sm">
            Communicate with Aashansh support and view messages from your customers.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartAdminChat}
          disabled={loading}
          className="btn h-11 px-6 rounded-xl bg-[#ffd401] hover:bg-[#e6be00] text-black font-bold text-sm border-0 flex items-center gap-2"
        >
          <ShieldAlert size={16} />
          {loading ? 'Starting...' : 'Chat with Admin'}
        </button>
      </div>

      {error && (
        <div className="bg-error/15 border border-error/30 text-error p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      <ChatPanel role="seller" />
    </div>
  );
};

export default SellerChat;
