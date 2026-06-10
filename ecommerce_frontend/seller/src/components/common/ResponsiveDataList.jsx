import React from 'react';
import ResponsiveTable from './ResponsiveTable';

/**
 * Desktop: scrollable table. Mobile/tablet: stacked cards.
 */
export default function ResponsiveDataList({
  columns,
  rows,
  rowKey = (row, index) => row.id ?? index,
  emptyMessage = 'No records yet.',
  tableMinWidth = '560px',
  className = '',
}) {
  if (!rows?.length) {
    return (
      <p className="text-sm text-text-muted text-center py-6">{emptyMessage}</p>
    );
  }

  return (
    <>
      <div className={`md:hidden space-y-3 ${className}`.trim()}>
        {rows.map((row, index) => (
          <div
            key={rowKey(row, index)}
            className="rounded-xl border border-glass-border p-4 space-y-2 bg-white/[0.02]"
          >
            {columns.map((col) => {
              const value = col.render ? col.render(row, index) : row[col.key];
              if (value == null || value === '') return null;
              return (
                <div key={col.key} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {col.label}
                  </span>
                  <span className="text-sm font-semibold break-words">{value}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hidden md:block">
        <ResponsiveTable minWidth={tableMinWidth} className={className}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-glass-border text-left">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="py-3 pr-4 text-xs font-bold text-text-muted uppercase whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={rowKey(row, index)} className="border-b border-glass-border/50 last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 pr-4 font-medium align-top">
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </ResponsiveTable>
      </div>
    </>
  );
}
