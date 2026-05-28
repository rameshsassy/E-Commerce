import React, { useCallback, useEffect, useState } from 'react';
import api, { BASE_URL } from '../../utils/api';
import SellerIndividualOrderDetail from './SellerIndividualOrderDetail';

const money = (n) => `₹ ${Number(n || 0).toLocaleString('en-IN')}/-`;

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
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const { data } = await api.get('/shipments/seller');
      setShipments(data.shipments || []);
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

  if (selectedId) {
    return (
      <SellerIndividualOrderDetail
        shipmentId={selectedId}
        onClose={() => {
          setSelectedId(null);
          load();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 md:p-8 rounded-2xl border border-glass-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold">All Orders</h2>
            <p className="text-sm text-text-muted">Select an order to view details, timeline, and update status.</p>
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
        ) : shipments.length === 0 ? (
          <div className="py-10 text-center text-text-muted">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-glass-border">
            <table className="w-full text-sm text-left min-w-[900px]">
              <thead>
                <tr className="bg-surface/80 text-text-muted border-b border-glass-border">
                  <th className="p-3 font-medium">Order ID</th>
                  <th className="p-3 font-medium">Image</th>
                  <th className="p-3 font-medium">Title</th>
                  <th className="p-3 font-medium">Customer</th>
                  <th className="p-3 font-medium">Total</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => {
                  const item = shipment.items?.[0];
                  const title = item?.title || '—';
                  const img = Array.isArray(item?.images) ? item.images[0] : '';

                  return (
                    <tr key={shipment._id} className="border-b border-glass-border/60 hover:bg-surface/40">
                      <td className="p-3 font-mono text-xs whitespace-nowrap">
                        {shipment.displayOrderId || '—'}
                      </td>
                      <td className="p-3">
                        <div className="w-12 h-12 rounded-lg bg-surface/40 border border-glass-border overflow-hidden">
                          {img ? (
                            <img src={imgUrl(img)} alt={title} className="w-full h-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                      </td>
                      <td className="p-3 max-w-[280px]">
                        <div className="font-medium line-clamp-2">{title}</div>
                      </td>
                      <td className="p-3 whitespace-nowrap">{shipment.customer?.name || '—'}</td>
                      <td className="p-3 whitespace-nowrap">{money(shipment.sellerGross)}</td>
                      <td className="p-3 whitespace-nowrap">{shipment.statusDisplay || shipment.status}</td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl bg-[#FFE566] text-black font-semibold border-2 border-gray-900 hover:bg-[#ffe566]/90 transition-colors"
                          onClick={() => setSelectedId(shipment._id)}
                        >
                          View
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
    </div>
  );
}
