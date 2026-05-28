import React, { useState } from 'react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';
import SellerShipmentsPanel from '../../components/seller/SellerShipmentsPanel';

const ORDER_TYPES = [
  { id: 'individual', label: 'individual Order' },
  { id: 'bulk', label: 'Bulk Orders' },
];

function orderTypeButtonClass(active) {
  return [
    'flex-1 py-3 px-4 rounded-2xl font-bold text-center text-gray-900',
    'border-2 border-gray-900 transition-colors',
    active ? 'bg-[#FFE566] shadow-sm' : 'bg-white hover:bg-gray-50',
  ].join(' ');
}

export default function SellerOrdersEnquiries() {
  const [orderType, setOrderType] = useState('individual');

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Orders &amp; Enquiries</h1>

      <div className="mb-8 max-w-xl">
        <p className="text-lg font-bold text-text mb-3">Order Type</p>
        <div className="flex gap-1">
          {ORDER_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setOrderType(type.id)}
              className={orderTypeButtonClass(orderType === type.id)}
              aria-pressed={orderType === type.id}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {orderType === 'individual' ? (
        <SellerShipmentsPanel />
      ) : (
        <BulkInquiriesPanel isAdmin={false} title="Bulk order inquiries" />
      )}
    </div>
  );
}
