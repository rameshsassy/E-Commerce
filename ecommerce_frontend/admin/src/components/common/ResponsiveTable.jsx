import React from 'react';

/**
 * Horizontally scrollable table wrapper for mobile/tablet admin & seller views.
 */
const ResponsiveTable = ({ children, minWidth = '720px', className = '' }) => {
  return (
    <div
      className={`responsive-table-wrap ${className}`.trim()}
      style={{ '--table-min-width': minWidth }}
    >
      {children}
    </div>
  );
};

export default ResponsiveTable;
