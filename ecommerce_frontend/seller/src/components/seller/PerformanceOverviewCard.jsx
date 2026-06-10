import React, { useMemo, useState } from 'react';
import { BASE_URL } from '../../utils/api';

const Img = ({ src, alt }) => {
  if (!src) {
    return (
      <div className="w-12 h-12 rounded-lg bg-white/10 border border-glass-border" />
    );
  }
  const full = src.startsWith('http') ? src : `${BASE_URL}/${String(src).replace(/\\/g, '/')}`;
  return (
    <img
      src={full}
      alt={alt}
      className="w-12 h-12 rounded-lg object-cover border border-glass-border bg-white/10"
      loading="lazy"
    />
  );
};

export default function PerformanceOverviewCard({
  icon,
  title,
  total,
  columns,
  rows,
  viewAllLabel = 'View All',
  onViewAll,
  defaultExpanded = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const visibleRows = useMemo(() => {
    if (!Array.isArray(rows)) return [];
    return expanded ? rows : rows.slice(0, 3);
  }, [rows, expanded]);

  return (
    <div className="bg-white rounded-2xl border border-[#E1E3E5] shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#F6F6F7] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-[13px] text-[#6D7175] font-medium truncate">{title}</div>
            <div className="text-[28px] md:text-[32px] font-bold text-[#202223] leading-tight truncate">
              {total}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-4 py-2 rounded-full bg-[#ffd401] hover:bg-[#e0bb00] text-black font-semibold text-[13px] md:text-[14px] shadow-sm flex items-center gap-2"
          >
            {expanded ? 'Collapse' : 'Expand'} <span className="text-[16px] leading-none">{expanded ? '−' : '+'}</span>
          </button>
          {onViewAll ? (
            <button
              type="button"
              onClick={onViewAll}
              className="px-4 py-2 rounded-full bg-[#ffd401] hover:bg-[#e0bb00] text-black font-semibold text-[13px] md:text-[14px] shadow-sm"
            >
              {viewAllLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="border-t border-[#E1E3E5]">
        <div className={`${expanded ? 'max-h-[340px]' : 'max-h-[200px]'} overflow-y-auto`}>
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-[#6D7175] text-[12px]">
                <th className="text-left font-medium px-6 py-3 w-[90px]">Product Image</th>
                {columns.map((c) => (
                  <th key={c.key} className={`font-medium px-6 py-3 ${c.align === 'right' ? 'text-right' : 'text-left'}`}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-6 text-[#6D7175]">
                    No data yet for this period.
                  </td>
                </tr>
              ) : (
                visibleRows.map((r, idx) => (
                  <tr key={r.id || r.productId || r.orderId || r.inquiryId || r.returnId || r.refundId || idx} className="border-t border-[#F1F2F3]">
                    <td className="px-6 py-4">
                      <Img src={r.image} alt={r.title || 'product'} />
                    </td>
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={`px-6 py-4 ${c.align === 'right' ? 'text-right' : 'text-left'} text-[#202223]`}
                      >
                        {c.render ? c.render(r) : (r[c.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-2 text-[11px] text-[#6D7175]">
          Scroll for more option
        </div>
      </div>
    </div>
  );
}

