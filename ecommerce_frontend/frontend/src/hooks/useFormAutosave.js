import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../utils/api';

function defaultIsEmpty(value) {
  if (value == null) return true;
  if (typeof value !== 'object') return String(value).trim() === '';
  return Object.values(value).every((v) => {
    if (v == null) return true;
    if (typeof v === 'boolean') return false;
    if (typeof v === 'number') return false;
    if (Array.isArray(v)) return v.length === 0;
    return String(v).trim() === '';
  });
}

/**
 * Debounced auto-save for any form state.
 * - Default: PUT /api/form-drafts/:formKey with JSON { data }
 * - Or pass saveFn for domain APIs (PATCH profile, PATCH KYC, etc.)
 */
export function useFormAutosave({
  formKey,
  value,
  enabled = true,
  debounceMs = 1500,
  saveFn,
  onRestore,
  isEmpty = defaultIsEmpty,
  restore = true,
}) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const skipSaveRef = useRef(true);
  const lastSigRef = useRef('');

  const clearDraft = useCallback(async () => {
    if (!formKey) return;
    try {
      await api.delete(`/form-drafts/${encodeURIComponent(formKey)}`);
    } catch {
      /* ignore */
    }
  }, [formKey]);

  useEffect(() => {
    if (!enabled || !formKey || !restore) {
      setHydrated(true);
      skipSaveRef.current = false;
      return undefined;
    }

    let cancelled = false;
    skipSaveRef.current = true;

    (async () => {
      try {
        const { data } = await api.get(`/form-drafts/${encodeURIComponent(formKey)}`);
        if (!cancelled && data?.draft?.data && onRestore) {
          onRestore(data.draft.data);
          lastSigRef.current = JSON.stringify(data.draft.data);
        }
      } catch {
        /* no draft yet */
      } finally {
        if (!cancelled) {
          setHydrated(true);
          window.setTimeout(() => {
            skipSaveRef.current = false;
          }, 50);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [formKey, enabled, restore, onRestore]);

  useEffect(() => {
    if (!enabled || !formKey || !hydrated || skipSaveRef.current) {
      return undefined;
    }

    const signature = JSON.stringify(value);
    if (signature === lastSigRef.current) return undefined;
    if (isEmpty(value)) return undefined;

    const timeoutId = window.setTimeout(async () => {
      setStatus('saving');
      setMessage('Auto-saving…');
      try {
        if (saveFn) {
          const result = await saveFn(value);
          setMessage(result?.message || 'Auto-saved');
        } else {
          const { data } = await api.put(`/form-drafts/${encodeURIComponent(formKey)}`, {
            data: value,
          });
          setMessage(data?.message || 'Auto-saved');
        }
        lastSigRef.current = signature;
        setStatus('saved');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Autosave failed');
      }
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [value, formKey, enabled, debounceMs, saveFn, isEmpty, hydrated]);

  const markSaved = useCallback((nextValue) => {
    lastSigRef.current = JSON.stringify(nextValue ?? value);
    skipSaveRef.current = false;
  }, [value]);

  const pauseAutosave = useCallback(() => {
    skipSaveRef.current = true;
  }, []);

  const resumeAutosave = useCallback(() => {
    skipSaveRef.current = false;
  }, []);

  return {
    status,
    message,
    clearDraft,
    markSaved,
    pauseAutosave,
    resumeAutosave,
    hydrated,
  };
}

export default useFormAutosave;
