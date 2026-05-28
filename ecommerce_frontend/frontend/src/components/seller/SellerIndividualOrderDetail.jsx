import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';
import OrderStatusTimeline from './OrderStatusTimeline';

const STATUS_OPTIONS = [
  'Accept Order',
  'Reject Order',
  'Order Dispatched',
  'Order Shipped',
  'Order in Transit',
  'Product Delivered',
];

const money = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}/-`;

const imgUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return `${BASE_URL}/${src}`;
};

const formatStatusTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} at ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export default function SellerIndividualOrderDetail({ shipmentId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!shipmentId) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get(`/shipments/seller/${shipmentId}`);
      setOrder(data.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load order');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (sellerOrderStatus) => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/shipments/seller/${shipmentId}/status`, {
        sellerOrderStatus,
      });
      setOrder(data.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-text-muted">Loading order…</div>;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error">{error || 'Order not found'}</div>
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Back to list
          </button>
        )}
      </div>
    );
  }

  const primaryImage = order.items?.[0]?.images?.[0];
  const statusValue = order.sellerOrderStatus || '';
  const statusLabel = order.statusDisplay || 'Order Placed';

  return (
    <div className="space-y-6 border-2 border-gray-900 rounded-3xl p-4 md:p-6 bg-[#f8f9fa]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Individual Order</h2>
        {onClose && (
          <button type="button" className="btn btn-secondary text-sm" onClick={onClose}>
            Back to list
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Customer Name</p>
          <p className="text-xl font-bold text-gray-900">{order.customer?.name}</p>
          <p className="text-xs text-gray-600 mt-2">{order.customer?.tag}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Order Total</p>
          <p className="text-xl font-bold text-gray-900">{money(order.sellerGross)}</p>
          <p className="text-xs text-gray-600 mt-2">{order.order?.paymentLabel}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Seller Payout</p>
          <p className="text-xl font-bold text-gray-900">{money(order.sellerPayout)}</p>
          <p className="text-xs text-gray-600 mt-2">
            After Platform Fee &amp; GST ({Number(order.platformFeePercent || 0).toFixed(2)}%)
          </p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Order Status</p>
          <div className="relative">
            <select
              className="w-full appearance-none text-lg font-bold text-gray-900 bg-transparent border-0 pr-8 py-1 focus:outline-none focus:ring-0 cursor-pointer disabled:opacity-60"
              value={statusValue}
              disabled={updating}
              onChange={(e) => updateStatus(e.target.value)}
            >
              <option value="" disabled>
                {statusLabel}
              </option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown size={20} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none" />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {formatStatusTime(order.statusUpdatedAt || order.updatedAt)}
          </p>
        </div>
      </div>

      <OrderStatusTimeline timeline={order.timeline} activeIndex={order.activeTimelineIndex ?? 0} />

      <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-4">
        <p className="text-lg font-bold text-gray-900">
          Order ID: <span className="font-mono tracking-wide">{order.displayOrderId || '—'}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-gray-900 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b-2 border-gray-900 text-gray-600">
              <th className="p-4 text-left font-semibold">Image</th>
              <th className="p-4 text-left font-semibold">Title</th>
              <th className="p-4 text-left font-semibold">Variant</th>
              <th className="p-4 text-left font-semibold">Quantity</th>
              <th className="p-4 text-left font-semibold">Email:</th>
              <th className="p-4 text-left font-semibold">Contact number</th>
              <th className="p-4 text-left font-semibold">Shipping address:</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-gray-900">
              <td className="p-4 align-top">
                <div className="w-20 h-20 rounded-lg border border-gray-300 overflow-hidden bg-gray-100">
                  {primaryImage ? (
                    <img src={imgUrl(primaryImage)} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
              </td>
              <td className="p-4 align-top max-w-[220px] font-medium">
                {order.items?.[0]?.title || '—'}
              </td>
              <td className="p-4 align-top">
                <ul className="list-disc list-inside space-y-1">
                  {(order.items || []).map((it) => (
                    <li key={`${it.productId}-${it.variantLabel}`}>{it.variantLabel}</li>
                  ))}
                </ul>
              </td>
              <td className="p-4 align-top">
                <ul className="list-disc list-inside space-y-1">
                  {(order.items || []).map((it) => (
                    <li key={`qty-${it.productId}-${it.variantLabel}`}>{it.quantity}</li>
                  ))}
                </ul>
              </td>
              <td className="p-4 align-top">{order.customer?.email}</td>
              <td className="p-4 align-top whitespace-nowrap">{order.customer?.phone}</td>
              <td className="p-4 align-top max-w-[240px]">{order.customer?.shippingAddress}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
