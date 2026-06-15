import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import LogoManagement from './LogoManagement';
import CategoryManagement from './CategoryManagement';
import BulkPurchaseSettings from './BulkPurchaseSettings';
import SearchSettings from './SearchSettings';
import CartSettings from './CartSettings';
import AccountSettings from './AccountSettings';
import AnnouncementBarManagement from './AnnouncementBarManagement';
import HeroBannerManagement from './HeroBannerManagement';
import { Settings, Image, Menu, Search, ShoppingCart, Megaphone, Layout, Loader2 } from 'lucide-react';

const HeaderManagement = () => {
  const [activeTab, setActiveTab] = useState('logo');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/homepage-settings');
      setSettings(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load homepage settings. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSettings = (newSettings) => {
    setSettings(newSettings);
  };

  const tabs = [
    { id: 'logo', name: 'Logo & General', icon: Image },
    { id: 'categories', name: 'Header Categories', icon: Menu },
    { id: 'search', name: 'Search Bar', icon: Search },
    { id: 'bulk', name: 'Bulk Purchase', icon: ShoppingCart },
    { id: 'announcement', name: 'Announcement Bar', icon: Megaphone },
    { id: 'hero', name: 'Hero Banner', icon: Layout },
  ];

  return (
    <div className="animate-fade-in w-full min-w-0">
      <div className="responsive-page-header mb-6">
        <div>
          <h1 className="font-bold flex items-center gap-2">
            <Settings className="text-primary" /> Homepage Management
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Configure the layout, features, navigation categories, and branding of the customer portal header.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-2xl bg-error/10 border border-error/20 text-error text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-24">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Navigation Sidebar */}
          <div className="glass-panel w-full lg:w-64 p-3 rounded-2xl border border-glass-border flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shrink-0 scrollbar-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap lg:w-full text-left ${
                    active
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'border border-transparent hover:bg-surface-hover text-text-muted hover:text-white'
                  }`}
                >
                  <TabIcon size={18} />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {/* Configuration Panel Content */}
          <div className="flex-1 w-full min-w-0 flex flex-col gap-6">
            {activeTab === 'logo' && (
              <>
                <LogoManagement settings={settings} onUpdate={handleUpdateSettings} />
                <CartSettings settings={settings} onUpdate={handleUpdateSettings} />
                <AccountSettings settings={settings} onUpdate={handleUpdateSettings} />
              </>
            )}

            {activeTab === 'categories' && (
              <CategoryManagement />
            )}

            {activeTab === 'search' && (
              <SearchSettings settings={settings} onUpdate={handleUpdateSettings} />
            )}

            {activeTab === 'bulk' && (
              <BulkPurchaseSettings settings={settings} onUpdate={handleUpdateSettings} />
            )}

            {activeTab === 'announcement' && (
              <AnnouncementBarManagement settings={settings} onUpdate={handleUpdateSettings} />
            )}

            {activeTab === 'hero' && (
              <HeroBannerManagement settings={settings} onUpdate={handleUpdateSettings} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderManagement;
