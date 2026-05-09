import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truck, Package, CheckCircle, ChevronLeft, Calendar } from 'lucide-react';
import api from '../../utils/api';

const OrderTracking = () => {
  const { shipmentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracking = async () => {
      try {
        const res = await api.get(`/shipments/customer/track/${shipmentId}`);
        setData(res.data);
      } catch (err) {
        console.error("Tracking error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTracking();
  }, [shipmentId]);

  if (loading) {
    return <div className="flex-1 flex justify-center items-center min-h-[60vh]"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!data || !data.shipment) {
    return <div className="flex-1 text-center py-20 text-error">Shipment Tracking details not found.</div>;
  }

  const { shipment, trackingDetails } = data;
  const isDelivered = shipment.status === 'Delivered';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto w-full animate-fade-in">
      <Link to="/profile" className="inline-flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Profile
      </Link>

      <div className="glass-panel p-8 rounded-3xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-8 border-b border-glass-border">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Truck className="text-primary" size={32} />
              Track Package
            </h1>
            <p className="text-text-muted">Order #{shipment.order.substring(shipment.order.length - 8)}</p>
          </div>
          
          <div className="bg-surface p-4 rounded-xl text-sm border border-glass-border shadow-sm">
            <p className="mb-1"><span className="text-text-muted">Tracking ID:</span> <span className="font-mono font-bold text-primary">{shipment.trackingId || 'Pending Allocation'}</span></p>
            <p><span className="text-text-muted">Courier:</span> <span className="font-medium">{shipment.courierName || 'Awaiting Pickup'}</span></p>
          </div>
        </div>

        {/* Status Highlight */}
        <div className={`p-6 rounded-2xl mb-12 flex items-center gap-4 ${isDelivered ? 'bg-success/10 border-success/30' : 'bg-primary/10 border-primary/30'} border`}>
          {isDelivered ? <CheckCircle size={40} className="text-success" /> : <Package size={40} className="text-primary" />}
          <div>
            <h2 className={`text-2xl font-bold ${isDelivered ? 'text-success' : 'text-primary'}`}>
              {isDelivered ? 'Delivered' : 'Arriving by ' + (shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toDateString() : 'TBD')}
            </h2>
            <p className="text-text-muted mt-1">
              Current Status: <span className="font-bold text-white">{trackingDetails.current_status || shipment.status}</span>
            </p>
          </div>
        </div>

        {/* Timeline */}
        <h3 className="text-xl font-bold mb-6">Tracking History</h3>
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-glass-border before:to-transparent">
          
          {trackingDetails.tracking_data && trackingDetails.tracking_data.length > 0 ? (
            trackingDetails.tracking_data.map((event, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                {/* Marker */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-surface bg-primary text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-glow z-10">
                  <CheckCircle size={16} />
                </div>
                
                {/* Event Card */}
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-surface p-4 rounded-xl border border-glass-border shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-text">{event.status}</h4>
                    <span className="text-xs text-text-muted flex items-center gap-1"><Calendar size={12}/> {new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-text-muted">{event.location}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-text-muted">
              <p>Tracking history will appear here once the courier updates the status.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
