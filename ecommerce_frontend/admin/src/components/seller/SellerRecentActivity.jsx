import React from 'react';
import { Link } from 'react-router-dom';
import {
  LogIn,
  Package,
  Upload,
  FileCheck,
  Store,
  Boxes,
  Truck,
  Sparkles,
  Circle,
} from 'lucide-react';

function formatWhen(date) {
  if (!date) return '';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function iconForType(type) {
  switch (type) {
    case 'login':
      return LogIn;
    case 'product_created':
    case 'product_updated':
    case 'product_deleted':
      return Package;
    case 'bulk_upload':
      return Upload;
    case 'kyc':
      return FileCheck;
    case 'store':
      return Store;
    case 'bulk_inquiry':
      return Boxes;
    case 'order':
      return Truck;
    case 'premium':
      return Sparkles;
    default:
      return Circle;
  }
}

export default function SellerRecentActivity({ activities, loading }) {
  if (loading) {
    return <p className="text-text-muted text-sm py-6">Loading recent activity…</p>;
  }

  if (!activities?.length) {
    return (
      <div className="text-center py-10 text-text-muted">
        <p>No recent activity.</p>
        <p className="text-xs mt-2 max-w-md mx-auto">
          Actions like signing in, adding products, updating orders, and KYC steps will appear here — even after you log out and return later.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((item) => {
        const Icon = iconForType(item.type);
        const inner = (
          <div className="flex gap-3 p-3 rounded-xl border border-glass-border/80 bg-surface/30 hover:bg-surface/50 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
              <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-text leading-snug">{item.title}</p>
              {item.description ? (
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{item.description}</p>
              ) : null}
              <p className="text-[11px] text-text-muted mt-1">{formatWhen(item.createdAt)}</p>
            </div>
          </div>
        );

        if (item.link) {
          return (
            <li key={item._id}>
              <Link to={item.link} className="block">
                {inner}
              </Link>
            </li>
          );
        }

        return <li key={item._id}>{inner}</li>;
      })}
    </ul>
  );
}
