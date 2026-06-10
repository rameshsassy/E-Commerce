import React, { useState } from 'react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';
import SellerShipmentsPanel from '../../components/seller/SellerShipmentsPanel';

const ORDER_TYPES = [
  { id: 'individual', label: 'individual Order' },
  { id: 'bulk', label: 'Bulk Orders' },
];

function orderTypeButtonClass(active) {
  return [
    'flex-1 min-w-0 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl font-bold text-center text-gray-900 text-sm sm:text-base',
    'border-2 border-gray-900 transition-colors',
    active ? 'bg-[#FFE566] shadow-sm' : 'bg-white hover:bg-gray-50',
  ].join(' ');
}

export default function SellerOrdersEnquiries() {
  const [orderType, setOrderType] = useState('individual');

  return (
    <div className="seller-page animate-fade-in">
      <h1 className="seller-page-title">Orders &amp; Enquiries</h1>

      <div className="mb-6 sm:mb-8 max-w-xl">
        <p className="text-base sm:text-lg font-bold text-text mb-3">Order Type</p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-1">
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
