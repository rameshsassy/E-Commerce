import React from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';

export default function FormAutosaveStatus({ status, message, className = '' }) {
  if (!message && status === 'idle') return null;

  const isSaving = status === 'saving';
  const isError = status === 'error';

  return (
    <p
      className={`text-xs flex items-center gap-1.5 ${isError ? 'text-error' : 'text-text-muted'} ${className}`}
      role="status"
      aria-live="polite"
    >
      {isSaving ? (
        <Loader2 size={14} className="animate-spin shrink-0" />
      ) : isError ? (
        <CloudOff size={14} className="shrink-0" />
      ) : (
        <Cloud size={14} className="shrink-0 text-success/80" />
      )}
      {message || (isSaving ? 'Auto-saving…' : 'Auto-saved')}
    </p>
  );
}
