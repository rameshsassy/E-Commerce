import React, { useState, useEffect, useRef } from 'react';
import { Bell, Package, CheckCircle, Tag, Info, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  // Initialize Socket and Fetch Initial Notifications
  useEffect(() => {
    if (!user) return;

    // 1. Fetch from DB
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        
        // Check if we have new unread notifications to trigger vibration
        setNotifications(prev => {
          const newUnreadCount = data.filter(n => !n.isRead).length;
          const oldUnreadCount = prev.filter(n => !n.isRead).length;
          
          if (newUnreadCount > oldUnreadCount && window.navigator.vibrate) {
            window.navigator.vibrate(200);
          }
          return data;
        });
      } catch (err) {
        console.error("Failed to fetch notifications");
      }
    };
    
    fetchNotifications();

    // 2. Poll every 10 seconds to simulate realtime (since socket.io couldn't install due to proxy)
    const intervalId = setInterval(fetchNotifications, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'order': return <CheckCircle size={18} className="text-success" />;
      case 'shipment': return <Package size={18} className="text-primary" />;
      case 'coupon': return <Tag size={18} className="text-warning" />;
      case 'refund': return <AlertCircle size={18} className="text-error" />;
      default: return <Info size={18} className="text-secondary" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'order': return 'bg-success/10 border-success/20';
      case 'shipment': return 'bg-primary/10 border-primary/20';
      case 'coupon': return 'bg-warning/10 border-warning/20';
      case 'refund': return 'bg-error/10 border-error/20';
      default: return 'bg-secondary/10 border-secondary/20';
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-text-muted hover:text-primary transition-colors p-1"
      >
        <Bell size={24} className={unreadCount > 0 ? "animate-pulse-slow" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-surface shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface border border-glass-border rounded-2xl shadow-2xl z-[100] animate-fade-in overflow-hidden flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-glass-border flex justify-between items-center bg-surface-hover/50">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Notifications {unreadCount > 0 && <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{unreadCount} New</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline font-medium">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-text-muted flex flex-col items-center">
                <Bell size={40} className="mb-3 opacity-20" />
                <p>No notifications yet</p>
                <p className="text-xs mt-1">We'll let you know when something important happens.</p>
              </div>
            ) : (
              <div className="divide-y divide-glass-border">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className={`p-4 hover:bg-white/5 transition-colors flex gap-3 relative ${!notification.isRead ? 'bg-primary/5' : ''}`}
                  >
                    {!notification.isRead && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"></div>
                    )}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getBgColor(notification.type)}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-text' : 'font-medium text-text-muted'}`}>
                        {notification.title}
                      </h4>
                      <p className={`text-xs mt-1 line-clamp-2 ${!notification.isRead ? 'text-text-muted' : 'text-text-muted/70'}`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-text-muted/50 mt-2 font-mono">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                      
                      {notification.link && (
                        <Link 
                          to={notification.link} 
                          onClick={() => { setIsOpen(false); handleMarkAsRead(notification._id); }}
                          className="inline-block mt-2 text-xs text-primary font-medium hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      )}
                    </div>
                    
                    {!notification.isRead && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification._id); }}
                        className="absolute right-4 top-4 w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20 hover:scale-150 transition-transform"
                        title="Mark as read"
                      ></button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-glass-border bg-surface-hover/30 text-center">
            <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-sm font-bold text-primary hover:text-white transition-colors">
              View All History
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
