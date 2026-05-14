import React, { useState, useEffect } from 'react';
import { Bell, Package, CheckCircle, Tag, Info, AlertCircle, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/notifications');
        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, [user]);

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
      case 'order': return <CheckCircle size={24} className="text-success" />;
      case 'shipment': return <Package size={24} className="text-primary" />;
      case 'coupon': return <Tag size={24} className="text-warning" />;
      case 'refund': return <AlertCircle size={24} className="text-error" />;
      default: return <Info size={24} className="text-secondary" />;
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

  if (loading) return <div className="p-8 text-center animate-pulse">Loading notifications...</div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-center mb-8 border-b border-glass-border pb-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="text-primary" size={32} /> Notifications
          </h2>
          <p className="text-text-muted mt-2">Manage your alerts and activity history</p>
        </div>
        
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn bg-surface hover:bg-surface-hover text-text flex items-center gap-2">
            <CheckCheck size={18} /> Mark all as read
          </button>
        )}
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden divide-y divide-glass-border shadow-xl">
        {notifications.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-surface-hover flex items-center justify-center mb-6">
              <Bell size={48} className="text-text-muted opacity-50" />
            </div>
            <h3 className="text-2xl font-bold mb-2">You're all caught up!</h3>
            <p className="text-text-muted">No new notifications right now. Check back later.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification._id} 
              className={`p-6 hover:bg-white/5 transition-all duration-300 flex flex-col sm:flex-row gap-4 relative ${!notification.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border ${getBgColor(notification.type)} shadow-inner`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-lg mb-1 ${!notification.isRead ? 'font-bold text-white' : 'font-medium text-text'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-text-muted whitespace-nowrap bg-surface-hover px-2 py-1 rounded-md font-mono">
                    {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <p className={`text-sm mt-2 leading-relaxed max-w-2xl ${!notification.isRead ? 'text-text-muted' : 'text-text-muted/70'}`}>
                  {notification.message}
                </p>
                
                {notification.link && (
                  <Link 
                    to={notification.link} 
                    className="inline-flex items-center gap-2 mt-4 text-sm font-bold text-primary hover:text-white transition-colors bg-primary/10 px-4 py-2 rounded-lg hover:bg-primary"
                  >
                    Take Action &rarr;
                  </Link>
                )}
              </div>

              {!notification.isRead && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
