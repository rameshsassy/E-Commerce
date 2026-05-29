import React from 'react';
import { X } from 'lucide-react';
import { BASE_URL } from '../../utils/api';

const Img = ({ src, alt }) => {
  if (!src) {
    return <div className="w-10 h-10 rounded-lg bg-[#F6F6F7] border border-[#E1E3E5]" />;
  }
  const full = src.startsWith('http') ? src : `${BASE_URL}/${String(src).replace(/\\/g, '/')}`;
  return (
    <img
      src={full}
      alt={alt}
      className="w-10 h-10 rounded-lg object-cover border border-[#E1E3E5] bg-[#F6F6F7]"
      loading="lazy"
    />
  );
};

export default function AnalyticsViewAllModal({
  open,
  title,
  total,
  columns = [],
  rows = [],
  loading = false,
  error = false,
  onClose,
  footerLink,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="analytics-view-all-title"
    >
      <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-5 flex items-start justify-between gap-4 border-b border-[#E1E3E5] shrink-0">
          <div className="min-w-0">
            <h2 id="analytics-view-all-title" className="text-lg font-bold text-[#202223] truncate">
              {title}
            </h2>
            {total != null && (
              <p className="text-sm text-[#6D7175] mt-1">Total: {total}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F6F6F7] text-[#6D7175]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="px-6 py-10 text-center text-[#6D7175]">Could not load full list. Please try again.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white z-10 border-b border-[#E1E3E5]">
                <tr className="text-[#6D7175] text-[12px]">
                  <th className="text-left font-medium px-6 py-3 w-[80px]">Image</th>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`font-medium px-6 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-[#6D7175]">
                      No data for this period.
                    </td>
                  </tr>
                ) : (
                  rows.map((r, idx) => (
                    <tr
                      key={r.id || r.productId || r.orderId || r.inquiryId || r.returnId || r.refundId || idx}
                      className="border-t border-[#F1F2F3]"
                    >
                      <td className="px-6 py-3">
                        <Img src={r.image} alt={r.title || 'product'} />
                      </td>
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-6 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'} text-[#202223]`}
                        >
                          {c.render ? c.render(r) : (r[c.key] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {(footerLink || !loading) && (
          <div className="px-6 py-4 border-t border-[#E1E3E5] flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-[#6D7175]">
              {!loading && !error && rows.length > 0
                ? `Showing ${rows.length} item${rows.length === 1 ? '' : 's'}`
                : null}
            </span>
            <div className="flex items-center gap-3">
              {footerLink}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full bg-[#F6F6F7] hover:bg-[#E1E3E5] text-[#202223] font-semibold text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
