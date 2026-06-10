import React from 'react';
import { isNetworkError } from '../../utils/apiErrors';
import NetworkErrorBanner from './NetworkErrorBanner';

/**
 * Shows the network pill for offline / connection errors; a standard alert for other errors.
 */
export default function LoadErrorMessage({
  error,
  isNetwork,
  onRetry,
  retrying = false,
}) {
  if (!error) return null;

  const network = isNetwork ?? isNetworkError(error);

  if (network) {
    return (
      <NetworkErrorBanner message={error} onRetry={onRetry} retrying={retrying} />
    );
  }

  return (
    <div className="mb-4 p-3 rounded-xl bg-error/10 border border-error/30 text-error text-sm" role="alert">
      {error}
    </div>
  );
}
