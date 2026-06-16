import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Users,
  ShoppingBag,
  Package,
  ShoppingCart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Eye,
  FileDown,
  RefreshCw,
  Database,
  ArrowUpFromLine,
  History,
  BarChart3,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import api from '../../utils/api';

// ─── Constants ───────────────────────────────────────────────────────────────

const IMPORT_TYPES = [
  { id: 'customers', label: 'Customers', icon: Users, color: '#6366f1', desc: 'Import customer accounts from Shopify or other platforms' },
  { id: 'sellers', label: 'Sellers', icon: ShoppingBag, color: '#ec4899', desc: 'Migrate seller/vendor profiles with business details' },
  { id: 'products', label: 'Products', icon: Package, color: '#10b981', desc: 'Bulk import product listings with categories and pricing' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, color: '#f59e0b', desc: 'Import historical order records and statuses' },
];

const IMPORT_MODES = [
  { id: 'skip_duplicates', label: 'Skip Duplicates', desc: 'Skip records that already exist (safe default)' },
  { id: 'update_existing', label: 'Update Existing', desc: 'Overwrite existing records with imported data' },
  { id: 'import_new_only', label: 'Import New Only', desc: 'Only add records that do not exist yet' },
];

const TABS = [
  { id: 'import', label: 'Data Import', icon: ArrowUpFromLine },
  { id: 'history', label: 'Import History', icon: History },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
];

const STEPS = ['Select Type', 'Upload File', 'Validate', 'Preview', 'Import'];

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    completed: { color: 'var(--color-success)', bg: 'rgba(16,185,129,0.12)', label: 'Completed' },
    failed: { color: 'var(--color-error)', bg: 'rgba(239,68,68,0.12)', label: 'Failed' },
    processing: { color: 'var(--color-warning)', bg: 'rgba(245,158,11,0.12)', label: 'Processing' },
    pending: { color: 'var(--color-text-muted)', bg: 'rgba(148,163,184,0.12)', label: 'Pending' },
  };
  const s = map[status] || map.pending;
  return (
    <span style={{ color: s.color, background: s.bg, padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color = 'var(--color-primary)' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: 'var(--color-bg)', borderRadius: 8, height: 10, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 8,
          transition: 'width 0.4s ease',
          boxShadow: `0 0 8px ${color}60`,
        }}
      />
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', minWidth: 64 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--color-surface)',
                border: `2px solid ${done ? 'var(--color-success)' : active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                fontSize: '0.85rem', fontWeight: 700,
                color: (done || active) ? '#fff' : 'var(--color-text-muted)',
                transition: 'all 0.3s ease',
                boxShadow: active ? '0 0 12px rgba(99,102,241,0.4)' : 'none',
              }}>
                {done ? <CheckCircle size={18} /> : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', color: active ? 'var(--color-text)' : 'var(--color-text-muted)', textAlign: 'center', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--color-success)' : 'var(--glass-border)', minWidth: 20, borderRadius: 2, transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Drop Zone ────────────────────────────────────────────────────────────────

function DropZone({ file, onFile, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div>
      {file ? (
        <div style={{
          border: '2px solid var(--color-success)', borderRadius: 12, padding: '1.25rem 1.5rem',
          background: 'rgba(16,185,129,0.06)', display: 'flex', alignItems: 'center', gap: '1rem',
        }}>
          <FileSpreadsheet size={28} color="var(--color-success)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'spreadsheet'}
            </p>
          </div>
          <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(99,102,241,0.05)' : 'var(--color-surface)',
            transition: 'all 0.2s ease',
          }}
        >
          <Upload size={36} color="var(--color-primary)" style={{ marginBottom: '0.75rem' }} />
          <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Drop your file here or click to browse</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>Supports CSV and Excel (.xlsx) files up to 20MB</p>
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && onFile(e.target.files[0])} />
        </div>
      )}
    </div>
  );
}

// ─── Data Preview Table ───────────────────────────────────────────────────────

function PreviewTable({ rows = [], errors = [] }) {
  if (!rows.length) return null;
  const headers = Object.keys(rows[0] || {});
  const errorRows = new Set(errors.map(e => e.row - 2));

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
        <thead>
          <tr style={{ background: 'var(--color-surface)' }}>
            <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>
              #
            </th>
            {headers.map(h => (
              <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 20).map((row, i) => (
            <tr
              key={i}
              style={{
                background: errorRows.has(i) ? 'rgba(239,68,68,0.07)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                borderLeft: errorRows.has(i) ? '3px solid var(--color-error)' : '3px solid transparent',
              }}
            >
              <td style={{ padding: '0.55rem 0.75rem', color: 'var(--color-text-muted)', borderBottom: '1px solid var(--glass-border)' }}>{i + 2}</td>
              {headers.map(h => (
                <td key={h} style={{ padding: '0.55rem 0.75rem', borderBottom: '1px solid var(--glass-border)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row[h] || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Error List ───────────────────────────────────────────────────────────────

function ErrorList({ errors = [] }) {
  if (!errors.length) return null;
  return (
    <div style={{ marginTop: '1rem' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-error)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <XCircle size={16} /> {errors.length} Validation Error{errors.length > 1 ? 's' : ''} Detected
      </h4>
      <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {errors.map((err, i) => (
          <div key={i} style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.78rem' }}>
            <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>Row {err.row} · {err.field}:</span>{' '}
            <span style={{ color: 'var(--color-text-muted)' }}>{err.message}</span>
            {err.data && <span style={{ color: 'var(--color-text-muted)' }}> — <code style={{ background: 'rgba(255,255,255,0.07)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>{String(err.data)}</code></span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Import Result Summary ────────────────────────────────────────────────────

function ImportResult({ result, onDownloadReport }) {
  if (!result) return null;
  const { totalRows, importedRows, skippedRows, failedRows, logId } = result;

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', borderRadius: 16, marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <CheckCircle size={24} color="var(--color-success)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Import Completed</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total Rows', value: totalRows, color: 'var(--color-primary)' },
          { label: 'Imported', value: importedRows, color: 'var(--color-success)' },
          { label: 'Skipped', value: skippedRows, color: 'var(--color-warning)' },
          { label: 'Failed', value: failedRows, color: 'var(--color-error)' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '0.85rem 1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>
      {failedRows > 0 && logId && (
        <button
          onClick={() => onDownloadReport(logId)}
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <FileDown size={16} /> Download Error Report
        </button>
      )}
    </div>
  );
}

// ─── History Table ────────────────────────────────────────────────────────────

function HistoryTable({ logs = [], onViewReport, onDownload }) {
  if (!logs.length) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)' }}>
        <History size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
        <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>No import history yet</p>
        <p style={{ fontSize: '0.85rem' }}>Your import sessions will appear here once you run them.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            {['Type', 'File Name', 'Total', 'Imported', 'Skipped', 'Failed', 'Mode', 'Date', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log._id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '0.75rem 1rem' }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{log.importType}</span>
              </td>
              <td style={{ padding: '0.75rem 1rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>
                {log.fileName}
              </td>
              <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{log.totalRows}</td>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--color-success)', fontWeight: 600 }}>{log.importedRows}</td>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--color-warning)', fontWeight: 600 }}>{log.skippedRows}</td>
              <td style={{ padding: '0.75rem 1rem', color: log.failedRows > 0 ? 'var(--color-error)' : 'inherit', fontWeight: 600 }}>{log.failedRows}</td>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                {log.importMode?.replace(/_/g, ' ')}
              </td>
              <td style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                {new Date(log.importedAt || log.createdAt).toLocaleString()}
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <StatusBadge status={log.status} />
              </td>
              <td style={{ padding: '0.75rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => onViewReport(log._id)}
                    style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: 'var(--color-surface)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--color-text)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <Eye size={13} /> View
                  </button>
                  {log.failedRows > 0 && (
                    <button
                      onClick={() => onDownload(log._id)}
                      style={{ padding: '0.3rem 0.6rem', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', color: 'var(--color-error)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <FileDown size={13} /> Errors
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({ report, onClose, onDownload }) {
  if (!report) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: 600, borderRadius: 20, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} color="var(--color-primary)" /> Import Report
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={22} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Import Type', value: report.importType, cap: true },
            { label: 'Status', value: <StatusBadge status={report.status} /> },
            { label: 'File Name', value: report.fileName },
            { label: 'Import Mode', value: report.importMode?.replace(/_/g, ' ') },
            { label: 'Imported By', value: report.importedBy?.name || report.importedBy?.email || 'Unknown' },
            { label: 'Date', value: new Date(report.importedAt || report.createdAt).toLocaleString() },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, textTransform: item.cap ? 'capitalize' : 'none' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: report.totalRows, color: 'var(--color-primary)' },
            { label: 'Imported', value: report.importedRows, color: 'var(--color-success)' },
            { label: 'Skipped', value: report.skippedRows, color: 'var(--color-warning)' },
            { label: 'Failed', value: report.failedRows, color: 'var(--color-error)' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', background: 'var(--color-bg)', borderRadius: 10, padding: '0.75rem 0.5rem' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {(report.errors || []).length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-error)' }}>
              Validation Errors ({report.errors.length})
            </h4>
            <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {report.errors.map((err, i) => (
                <div key={i} style={{ fontSize: '0.77rem', background: 'rgba(239,68,68,0.07)', borderRadius: 7, padding: '0.4rem 0.65rem', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <strong style={{ color: 'var(--color-error)' }}>Row {err.row} · {err.field}:</strong>{' '}
                  <span style={{ color: 'var(--color-text-muted)' }}>{err.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {report.failedRows > 0 && (
            <button onClick={() => onDownload(report._id)} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <FileDown size={15} /> Download Error Report
            </button>
          )}
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1, fontSize: '0.85rem' }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminDataMigration = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [currentStep, setCurrentStep] = useState(0);
  const [importType, setImportType] = useState('customers');
  const [importMode, setImportMode] = useState('skip_duplicates');
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [viewReport, setViewReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Fetch history ────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/superadmin/import/history', { params: { importType: historyFilter, limit: 50 } });
      setHistory(data.logs || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilter, showToast]);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'reports') fetchHistory();
  }, [activeTab, fetchHistory]);

  // ── Download template ─────────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const { data } = await api.get(`/superadmin/import/template/${importType}`, { responseType: 'blob' });
      const blobUrl = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${importType}-sample-template.xlsx`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      showToast(`${importType} template downloaded!`);
    } catch {
      showToast('Failed to download template', 'error');
    }
  };

  // ── Validate file ─────────────────────────────────────────────────────────────
  const handleValidate = async () => {
    if (!file) return;
    setLoading(true);
    setValidationResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importType', importType);
      const { data } = await api.post('/superadmin/import/validate', formData);
      setValidationResult(data);
      setCurrentStep(3);
    } catch (err) {
      showToast(err.response?.data?.message || 'Validation failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Run import ────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setImportProgress(0);

    // Fake progress animation
    const interval = setInterval(() => {
      setImportProgress(p => p < 85 ? p + Math.random() * 8 : p);
    }, 300);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('importMode', importMode);
      const { data } = await api.post(`/superadmin/import/${importType}`, formData);
      clearInterval(interval);
      setImportProgress(100);
      setImportResult(data);
      setCurrentStep(4);
      showToast('Import completed successfully!', 'success');
    } catch (err) {
      clearInterval(interval);
      setImportProgress(0);
      showToast(err.response?.data?.message || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Download error report ─────────────────────────────────────────────────────
  const handleDownloadReport = async (logId) => {
    try {
      const { data } = await api.get(`/superadmin/import/report/${logId}/download`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-report-${logId}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Failed to download error report', 'error');
    }
  };

  // ── View report ───────────────────────────────────────────────────────────────
  const handleViewReport = async (logId) => {
    setReportLoading(true);
    try {
      const { data } = await api.get(`/superadmin/import/report/${logId}`);
      setViewReport(data);
    } catch {
      showToast('Failed to load report', 'error');
    } finally {
      setReportLoading(false);
    }
  };

  // ── Reset flow ────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep(0);
    setFile(null);
    setValidationResult(null);
    setImportResult(null);
    setImportProgress(0);
  };

  const selectedType = IMPORT_TYPES.find(t => t.id === importType);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>

      {/* ── Toast ─────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)',
          color: '#fff', padding: '0.85rem 1.25rem', borderRadius: 12,
          fontWeight: 600, fontSize: '0.88rem', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem', backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.3s ease',
        }}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────────── */}
      <div className="responsive-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} color="#fff" />
            </div>
            <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Data Migration
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            Import customers, sellers, products, and orders from Shopify or any other platform using CSV or Excel files.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <Download size={16} /> Sample Template
          </button>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--color-surface)', borderRadius: 12, padding: '0.25rem', marginBottom: '2rem', overflowX: 'auto' }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, minWidth: 100, padding: '0.65rem 1rem', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                color: active ? '#fff' : 'var(--color-text-muted)',
                fontWeight: active ? 600 : 400, fontSize: '0.84rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                transition: 'all 0.2s ease',
                boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════ IMPORT TAB ═════════════════════════════ */}
      {activeTab === 'import' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

          {/* Step indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* ── Step 0: Select Type ────────────────────────────────────────────── */}
          {currentStep >= 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 18 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 800, flexShrink: 0 }}>1</span>
                Select Import Type
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {IMPORT_TYPES.map(type => {
                  const Icon = type.icon;
                  const selected = importType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => { setImportType(type.id); if (currentStep === 0) setCurrentStep(1); }}
                      style={{
                        padding: '1.1rem', borderRadius: 14, border: `2px solid ${selected ? type.color : 'var(--glass-border)'}`,
                        background: selected ? `${type.color}12` : 'var(--color-surface)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s ease',
                        transform: selected ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: selected ? `0 0 16px ${type.color}30` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                        <Icon size={22} color={selected ? type.color : 'var(--color-text-muted)'} />
                        <span style={{ fontWeight: 700, color: selected ? type.color : 'var(--color-text)', fontSize: '0.95rem' }}>{type.label}</span>
                        {selected && <CheckCircle size={16} color={type.color} style={{ marginLeft: 'auto' }} />}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{type.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 1: Upload File ────────────────────────────────────────────── */}
          {currentStep >= 1 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 18 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 800, flexShrink: 0 }}>2</span>
                Upload File
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Info size={13} /> CSV or Excel (.xlsx)
                </span>
              </h2>

              <DropZone file={file} onFile={(f) => { setFile(f); setCurrentStep(2); setValidationResult(null); setImportResult(null); }} onRemove={() => { setFile(null); setCurrentStep(1); setValidationResult(null); }} />

              {file && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleValidate}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}
                  >
                    {loading && currentStep < 3 ? <Loader2 size={16} className="spin" /> : <CheckCircle size={16} />}
                    Validate File
                  </button>
                  <button onClick={handleDownloadTemplate} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <Download size={16} /> Download Template
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Validation Result ──────────────────────────────────────── */}
          {currentStep >= 3 && validationResult && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 18 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 800, flexShrink: 0 }}>3</span>
                Validation Results
              </h2>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Total Rows', value: validationResult.totalRows, color: 'var(--color-primary)' },
                  { label: 'Valid', value: validationResult.validRows, color: 'var(--color-success)' },
                  { label: 'Errors', value: validationResult.errorRows, color: 'var(--color-error)' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--color-bg)', borderRadius: 10, padding: '0.85rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {validationResult.errorRows > 0 && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '0.85rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', fontSize: '0.82rem' }}>
                  <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ color: 'var(--color-warning)' }}>
                    <strong>{validationResult.errorRows} rows</strong> have validation errors and will be skipped during import. Review errors below, fix your file, and re-upload.
                  </span>
                </div>
              )}

              <ErrorList errors={validationResult.errors || []} />
            </div>
          )}

          {/* ── Step 3: Preview ────────────────────────────────────────────────── */}
          {currentStep >= 3 && validationResult?.preview?.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 18 }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 800, flexShrink: 0 }}>4</span>
                Data Preview
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                  (First {Math.min(20, validationResult.totalRows)} of {validationResult.totalRows} rows)
                </span>
              </h2>
              <PreviewTable rows={validationResult.preview} errors={validationResult.errors} />

              {/* Import Mode */}
              <div style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--color-text)' }}>Import Mode</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {IMPORT_MODES.map(mode => (
                    <label
                      key={mode.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.85rem',
                        padding: '0.85rem 1rem', borderRadius: 10,
                        border: `2px solid ${importMode === mode.id ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                        background: importMode === mode.id ? 'rgba(99,102,241,0.07)' : 'var(--color-surface)',
                        cursor: 'pointer', transition: 'all 0.2s ease',
                      }}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        value={mode.id}
                        checked={importMode === mode.id}
                        onChange={() => setImportMode(mode.id)}
                        style={{ accentColor: 'var(--color-primary)', width: 18, height: 18, flexShrink: 0 }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: importMode === mode.id ? 'var(--color-primary)' : 'var(--color-text)' }}>{mode.label}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{mode.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Import button */}
                <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleImport}
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem', background: `linear-gradient(135deg, #6366f1, #ec4899)` }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <ArrowUpFromLine size={18} />}
                    {loading ? 'Importing...' : `Import ${selectedType?.label}`}
                  </button>
                  <button onClick={handleReset} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
                    <RefreshCw size={15} /> Start Over
                  </button>
                </div>

                {/* Progress bar */}
                {loading && importProgress > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <span>Importing records…</span>
                      <span>{Math.round(importProgress)}%</span>
                    </div>
                    <ProgressBar value={importProgress} max={100} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 4: Result ─────────────────────────────────────────────────── */}
          {importResult && (
            <>
              <ImportResult result={importResult} onDownloadReport={handleDownloadReport} />
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button onClick={handleReset} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw size={16} /> New Import
                </button>
                <button onClick={() => { setActiveTab('history'); fetchHistory(); }} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <History size={16} /> View History
                </button>
              </div>
            </>
          )}

          {/* Notice if no validation done yet */}
          {currentStep < 2 && !file && (
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <FileSpreadsheet size={44} style={{ margin: '0 auto 1rem', opacity: 0.4, color: 'var(--color-primary)' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--color-text)' }}>Ready to import data</p>
              <p style={{ fontSize: '0.83rem' }}>
                Select an import type above, then upload your CSV or Excel file.{' '}
                <button onClick={handleDownloadTemplate} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600 }}>
                  Download sample template
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════ HISTORY TAB ════════════════════════════ */}
      {activeTab === 'history' && (
        <div className="glass-panel" style={{ borderRadius: 18, padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={18} color="var(--color-primary)" /> Import History
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="input-field"
                style={{ width: 'auto', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}
              >
                <option value="all">All Types</option>
                {IMPORT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <button onClick={fetchHistory} className="btn btn-secondary" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <Loader2 size={28} className="spin" />
              <p>Loading history…</p>
            </div>
          ) : (
            <HistoryTable
              logs={history}
              onViewReport={handleViewReport}
              onDownload={handleDownloadReport}
            />
          )}
        </div>
      )}

      {/* ═══════════════════════════════ REPORTS TAB ════════════════════════════ */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ borderRadius: 18, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} color="var(--color-primary)" /> Import Overview
            </h2>

            {historyLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <Loader2 size={24} className="spin" />
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {IMPORT_TYPES.map(type => {
                    const typeLogs = history.filter(l => l.importType === type.id);
                    const total = typeLogs.reduce((s, l) => s + (l.importedRows || 0), 0);
                    const Icon = type.icon;
                    return (
                      <div key={type.id} style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '1rem', borderLeft: `4px solid ${type.color}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                          <Icon size={18} color={type.color} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{type.label}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: type.color }}>{total.toLocaleString()}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{typeLogs.length} import session{typeLogs.length !== 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent sessions */}
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--color-text-muted)' }}>Recent Sessions</h3>
                {history.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No import sessions found.</p>
                ) : (
                  history.slice(0, 5).map(log => {
                    const successRate = log.totalRows > 0 ? Math.round((log.importedRows / log.totalRows) * 100) : 0;
                    return (
                      <div key={log._id} style={{ background: 'var(--color-bg)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 700, fontSize: '0.88rem' }}>{log.importType}</span>
                            <StatusBadge status={log.status} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            <Clock size={12} />
                            {new Date(log.importedAt || log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{log.fileName}</span>
                          <span style={{ fontWeight: 600 }}>{successRate}% success</span>
                        </div>
                        <ProgressBar value={log.importedRows} max={log.totalRows} color="var(--color-success)" />
                      </div>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {viewReport && (
        <ReportModal
          report={viewReport}
          onClose={() => setViewReport(null)}
          onDownload={handleDownloadReport}
        />
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AdminDataMigration;
