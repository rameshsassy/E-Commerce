import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import api, { BASE_URL } from '../../utils/api';
import LoadErrorMessage from '../common/LoadErrorMessage';
import { getApiErrorMessage, isNetworkError } from '../../utils/apiErrors';
import OrderStatusTimeline from './OrderStatusTimeline';

const SELLER_STATUS_OPTIONS = [
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

export default function SellerBulkOrderDetail({ inquiryId, onClose }) {
  const navigate = useNavigate();
  const [bulk, setBulk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNetworkErrorState, setIsNetworkErrorState] = useState(false);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!inquiryId) return;
    setError('');
    setIsNetworkErrorState(false);
    setLoading(true);
    try {
      const { data } = await api.get(`/seller/bulk-inquiries/${inquiryId}`);
      setBulk(data.data);
    } catch (e) {
      setIsNetworkErrorState(isNetworkError(e));
      setError(getApiErrorMessage(e, 'Could not load bulk order'));
      setBulk(null);
    } finally {
      setLoading(false);
    }
  }, [inquiryId]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (body) => {
    setUpdating(true);
    try {
      const { data } = await api.patch(`/seller/bulk-inquiries/${inquiryId}`, body);
      setBulk(data.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleChatWithCustomer = async () => {
    if (!bulk.customer?._id) return;
    try {
      await api.post('/chat/conversations', {
        type: 'customer_seller',
        customerId: bulk.customer._id,
      });
      navigate('/seller/chat');
    } catch (err) {
      console.error('Failed to start chat with customer', err);
      alert(err.response?.data?.message || 'Could not initiate chat with customer.');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-text-muted">Loading bulk order…</div>;
  }

  if (error || !bulk) {
    return (
      <div className="space-y-4">
        <LoadErrorMessage
          error={error || 'Not found'}
          isNetwork={isNetworkErrorState}
          onRetry={isNetworkErrorState ? load : undefined}
          retrying={loading}
        />
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Back to list
          </button>
        )}
      </div>
    );
  }

  const primaryImage = bulk.product?.primaryImage || bulk.product?.images?.[0];
  const costDisplay =
    bulk.estimatedCostFormatted != null ? money(bulk.estimatedCostFormatted) : '—';

  return (
    <div className="space-y-6 border-2 border-gray-900 rounded-3xl p-4 md:p-6 bg-[#f8f9fa]">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Bulk Order</h2>
        {onClose && (
          <button type="button" className="btn btn-secondary text-sm" onClick={onClose}>
            Back to list
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5 flex flex-col justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1">Customer Name</p>
            <p className="text-xl font-bold text-gray-900">{bulk.customer?.name}</p>
            <p className="text-xs text-gray-600 mt-2">{bulk.customer?.tag}</p>
          </div>
          {bulk.customer?._id && (
            <button
              type="button"
              onClick={handleChatWithCustomer}
              className="mt-3 w-full py-1.5 px-3 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg border-0 transition-colors"
            >
              Chat with Customer
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Estimated Cost</p>
          <p className="text-xl font-bold text-gray-900">{costDisplay}</p>
          <p className="text-xs text-gray-600 mt-2">{bulk.orderTypeLabel}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Requested Delivery Date</p>
          <p className="text-xl font-bold text-gray-900">{bulk.requestedDeliveryDateFormatted}</p>
          <p className="text-xs text-gray-600 mt-2">{bulk.deliveryLeadLabel}</p>
        </div>

        <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-5">
          <p className="text-sm font-semibold text-gray-700 mb-1">Buyer Type</p>
          <div className="relative">
            <select
              className="w-full appearance-none text-lg font-bold text-gray-900 bg-transparent border-0 pr-8 py-1 focus:outline-none cursor-pointer disabled:opacity-60"
              value={bulk.buyerType || ''}
              disabled={updating}
              onChange={(e) => patch({ buyerType: e.target.value })}
            >
              <option value="" disabled>
                Select one
              </option>
              {(bulk.buyerTypeOptions || []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              size={20}
              className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-700 pointer-events-none"
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {formatStatusTime(bulk.buyerTypeUpdatedAt || bulk.updatedAt)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-700">Fulfillment status:</span>
        <select
          className="input-field py-2 text-sm max-w-xs bg-white border-2 border-gray-900 rounded-xl font-semibold"
          value={bulk.sellerOrderStatus || ''}
          disabled={updating}
          onChange={(e) => e.target.value && patch({ sellerOrderStatus: e.target.value })}
        >
          <option value="" disabled>
            Update timeline…
          </option>
          {SELLER_STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <OrderStatusTimeline timeline={bulk.timeline} activeIndex={bulk.activeTimelineIndex ?? 0} />

      <div className="bg-white rounded-2xl border-2 border-gray-900 px-5 py-4">
        <p className="text-lg font-bold text-gray-900">
          Bulk Request ID:{' '}
          <span className="font-mono tracking-wide">{bulk.displayBulkRequestId || '—'}</span>
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
              <th className="p-4 text-left font-semibold">Company/Organisation</th>
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
              <td className="p-4 align-top max-w-[220px] font-medium">{bulk.product?.title}</td>
              <td className="p-4 align-top">
                <ul className="list-disc list-inside space-y-1">
                  {(bulk.variantLines || []).map((v) => (
                    <li key={v.label}>{v.label}</li>
                  ))}
                </ul>
              </td>
              <td className="p-4 align-top">
                <ul className="list-disc list-inside space-y-1">
                  {(bulk.variantLines || []).map((v) => (
                    <li key={`q-${v.label}`}>{v.quantity}</li>
                  ))}
                </ul>
              </td>
              <td className="p-4 align-top">{bulk.customer?.email}</td>
              <td className="p-4 align-top whitespace-nowrap">{bulk.customer?.phone}</td>
              <td className="p-4 align-top max-w-[240px]">{bulk.customer?.companyOrganisation}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
