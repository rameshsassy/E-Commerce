import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { BASE_URL } from '../../utils/api';

const STATUS_OPTIONS = [
  { label: 'Mark as Order Accepted', value: 'Pending' },
  { label: 'Mark as Order Shipped', value: 'Shipped' },
  { label: 'Mark as Order in transit', value: 'Out For Delivery' },
  { label: 'Mark as Product Delivered', value: 'Delivered' },
];

const money = (n) => `₹ ${Number(n || 0).toLocaleString()}/-`;

const imgUrl = (src) => {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  if (src.startsWith('/')) return `${BASE_URL}${src}`;
  return `${BASE_URL}/${src}`;
};

export default function SellerShipmentsPanel() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState('');

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/shipments/seller');
      setShipments(data.shipments || []);
      setSelected(null);
    } catch (e) {
      setError(e.response?.data?.message || 'Could not load orders');
      setShipments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flatRows = useMemo(() => {
    const rows = [];
    for (const s of shipments) {
      for (const it of s.items || []) {
        rows.push({ shipment: s, item: it, key: `${s._id}:${it.productId}` });
      }
    }
    return rows;
  }, [shipments]);

  const updateStatus = async (shipmentId, status) => {
    setUpdatingId(shipmentId);
    try {
      await api.put(`/shipments/seller/${shipmentId}/status`, { status });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || 'Update failed');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-glass-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold">All Orders</h2>
            <p className="text-sm text-text-muted">Manage shipment status for your orders.</p>
          </div>
          <button type="button" className="btn btn-secondary self-start md:self-auto" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm">{error}</div>
        )}

        {loading ? (
          <div className="py-10 text-center text-text-muted">Loading…</div>
        ) : flatRows.length === 0 ? (
          <div className="py-10 text-center text-text-muted">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-glass-border">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead>
                <tr className="bg-surface/80 text-text-muted border-b border-glass-border">
                  <th className="p-3 font-medium">Image</th>
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Quantity</th>
                  <th className="p-3 font-medium">Customer Name</th>
                  <th className="p-3 font-medium">Address</th>
                  <th className="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {flatRows.map(({ shipment, item, key }) => {
                  const address = shipment?.order?.shippingAddress || {};
                  const title = item?.title || '—';
                  const qty = item?.quantity ?? 0;
                  const customerName = address?.fullName || address?.name || '—';
                  const addressText = [
                    address?.address,
                    address?.addressLine1,
                    address?.addressLine2,
                    address?.city,
                    address?.state,
                    address?.country,
                    address?.pinCode,
                  ]
                    .filter(Boolean)
                    .join(', ');
                  const img = Array.isArray(item?.images) ? item.images[0] : '';

                  return (
                    <tr key={key} className="border-b border-glass-border/60 hover:bg-surface/40">
                      <td className="p-3">
                        <div className="w-12 h-12 rounded-lg bg-surface/40 border border-glass-border overflow-hidden">
                          {img ? (
                            <img src={imgUrl(img)} alt={title} className="w-full h-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 max-w-[420px]">
                        <div className="font-medium line-clamp-2">{title}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{qty} unit/units</td>
                      <td className="p-3 whitespace-nowrap">{customerName}</td>
                      <td className="p-3 max-w-[420px]">
                        <div className="text-text-muted line-clamp-2" title={addressText}>
                          {addressText || '—'}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-warning text-black font-semibold hover:bg-warning/90 transition-colors"
                          onClick={() => setSelected(shipment)}
                        >
                          ACTION
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="glass-panel p-6 md:p-8 rounded-2xl border border-glass-border">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold">Order details</h3>
              <p className="text-sm text-text-muted">
                {selected.createdAt ? new Date(selected.createdAt).toLocaleString() : ''}
              </p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm px-6 py-6">
              <div className="text-[12px] text-[#6D7175] font-medium mb-2">Customer Name</div>
              <div className="text-[20px] font-bold text-[#202223]">
                {selected?.order?.shippingAddress?.fullName || selected?.order?.shippingAddress?.name || '—'}
              </div>
              <div className="text-[12px] text-[#6D7175] mt-2">
                {selected?.order?.shippingAddress?.city || '—'}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm px-6 py-6">
              <div className="text-[12px] text-[#6D7175] font-medium mb-2">Order Total</div>
              <div className="text-[20px] font-bold text-[#202223]">{money(selected.sellerGross)}</div>
              <div className="text-[12px] text-[#6D7175] mt-2">
                Platform fee {Number(selected.platformFeePercent || 0).toFixed(2)}%
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm px-6 py-6">
              <div className="text-[12px] text-[#6D7175] font-medium mb-2">Seller Payout</div>
              <div className="text-[20px] font-bold text-[#202223]">{money(selected.sellerPayout)}</div>
              <div className="text-[12px] text-[#6D7175] mt-2">After Platform Fee &amp; GST</div>
            </div>

            <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm px-6 py-6">
              <div className="text-[12px] text-[#6D7175] font-medium mb-2">Tracking Status</div>
              <select
                className="input-field py-2"
                value={selected.status}
                disabled={updatingId === selected._id}
                onChange={(e) => updateStatus(selected._id, e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <div className="text-[12px] text-[#6D7175] mt-2">
                {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

