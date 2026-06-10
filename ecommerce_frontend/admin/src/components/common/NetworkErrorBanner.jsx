import React from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Pill-style network error bar (white outline, coral text) — matches seller dashboard design.
 */
export default function NetworkErrorBanner({ message, onRetry, retrying = false }) {
  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div
        className="flex-1 px-5 py-3 rounded-full border-2 border-white text-[#e57373] text-sm font-medium text-left"
        role="alert"
      >
        {message}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="btn btn-secondary inline-flex items-center gap-2 shrink-0 self-start sm:self-auto rounded-full"
        >
          <RefreshCw size={16} className={retrying ? 'animate-spin' : ''} />
          Retry
        </button>
      )}
    </div>
  );
}
