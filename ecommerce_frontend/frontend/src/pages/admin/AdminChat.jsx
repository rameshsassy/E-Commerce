import React from 'react';
import ChatPanel from '../../components/chat/ChatPanel';
import { Shield } from 'lucide-react';

const AdminChat = () => {
  return (
    <div className="animate-fade-in w-full space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="text-primary" /> Admin Chat Inbox
        </h1>
        <p className="text-text-muted mt-2">
          View all support tickets, group conversations, and assign chats to sub-admin staff members.
        </p>
      </div>

      <ChatPanel role="admin" />
    </div>
  );
};

export default AdminChat;
