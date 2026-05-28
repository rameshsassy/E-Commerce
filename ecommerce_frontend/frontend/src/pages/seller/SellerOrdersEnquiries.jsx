import React from 'react';
import BulkInquiriesPanel from '../../components/bulk/BulkInquiriesPanel';
import SellerShipmentsPanel from '../../components/seller/SellerShipmentsPanel';

export default function SellerOrdersEnquiries() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold mb-8">Order &amp; Enquiries</h1>

      <div className="mb-10">
        <SellerShipmentsPanel />
      </div>

      <BulkInquiriesPanel isAdmin={false} title="Bulk order inquiries" />
    </div>
  );
}

