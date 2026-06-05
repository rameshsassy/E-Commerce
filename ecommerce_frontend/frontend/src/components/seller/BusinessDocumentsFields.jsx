import { useState, useMemo } from 'react';
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: 'var(--color-text-muted)',
  fontWeight: 'bold',
  fontSize: '0.875rem',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1.25rem 1.5rem',
};

const fileInputStyle = {
  width: '100%',
  fontSize: '0.875rem',
};

const helperTextStyle = {
  fontSize: '0.75rem',
  color: 'var(--color-text-muted)',
  marginTop: '0.35rem',
};

const Required = () => <span style={{ color: '#ef4444' }}> *</span>;

// ─── PAN & GST Validation (mirrors backend) ──────────────────────────────────
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

function validatePan(value) {
  if (!value || !value.trim()) return { status: 'empty', message: '' };
  const trimmed = value.trim();
  if (trimmed.length > 10) return { status: 'error', message: 'PAN must be max 10 characters.' };
  if (!PAN_REGEX.test(trimmed)) return { status: 'error', message: 'Oops! Please mention the correct PAN' };
  return { status: 'success', message: 'Perfect! This looks good' };
}

function validateGst(value) {
  if (!value || !value.trim()) return { status: 'empty', message: '' };
  const trimmed = value.trim();
  if (trimmed.length > 15) return { status: 'error', message: 'GST must be max 15 characters.' };
  if (!GST_REGEX.test(trimmed)) return { status: 'error', message: 'Oops! Please mention the correct GST' };
  return { status: 'success', message: 'Perfect! This looks good' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExistingDocHint({ show }) {
  if (!show) return null;
  return (
    <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.35rem' }}>
      Previously uploaded — choose a file to replace
    </p>
  );
}

function FilePreviewLink({ file, docPath, baseUrl, label = 'Preview document' }) {
  if (!file && !docPath) return null;
  const handlePreview = (e) => {
    e.preventDefault();
    if (file) {
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    } else if (docPath) {
      const url = `${baseUrl}/${docPath.replace(/\\/g, '/')}`;
      window.open(url, '_blank');
    }
  };
  return (
    <button
      type="button"
      onClick={handlePreview}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontSize: '0.75rem',
        color: 'var(--color-primary, #005bd3)',
        marginTop: '0.35rem',
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        fontWeight: 600,
        textDecoration: 'underline',
      }}
    >
      <ExternalLink size={13} />
      {file ? `Preview selected file (${file.name})` : label}
    </button>
  );
}

function ValidationFeedback({ status, message }) {
  if (!message || status === 'empty') return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        marginTop: '0.4rem',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: status === 'success' ? 'var(--color-success, #22c55e)' : '#ef4444',
      }}
    >
      {status === 'success' ? (
        <CheckCircle2 size={15} style={{ color: 'var(--color-success, #22c55e)' }} />
      ) : (
        <AlertCircle size={15} style={{ color: '#ef4444' }} />
      )}
      {message}
    </div>
  );
}

/**
 * Two-column Business Documents block.
 *
 * Changes per annotated image:
 * - Removed Admin Cost (percentage) field
 * - Registration Number: helper text about PAN for non-registered businesses
 * - Registration Certificate: helper text about uploading PAN if no cert
 * - PAN Number: compulsory, max 10 chars, real-time validation
 * - GST Number: NOT compulsory, max 15 chars, real-time validation
 * - All document uploads: "View uploaded document" link that opens in new tab
 */
export default function BusinessDocumentsFields({
  form,
  documents,
  existingDocs,
  existingDocPaths = {},
  baseUrl = '',
  onChange,
  onDocumentChange,
}) {
  const panValidation = useMemo(() => validatePan(form.orgPanNumber), [form.orgPanNumber]);
  const gstValidation = useMemo(() => validateGst(form.gstNumber), [form.gstNumber]);

  return (
    <section>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
        Business Documents
      </h3>

      <div style={gridStyle} className="business-docs-grid">
        {/* Row 1 — Date of Registration (full width, admin cost removed) */}
        <div>
          <label style={labelStyle}>
            Date of registration
            <Required />
          </label>
          <input
            type="date"
            name="dateOfRegistration"
            className="input-field"
            value={form.dateOfRegistration}
            onChange={onChange}
          />
          <p style={helperTextStyle}>
            Enter the date when you started the business.
          </p>
        </div>

        {/* Spacer for grid alignment — admin cost removed */}
        <div />

        {/* Row 2 — Registration Number + Certificate */}
        <div>
          <label style={labelStyle}>
            Registration Number
            <Required />
          </label>
          <input
            type="text"
            name="registrationNumber"
            className="input-field"
            value={form.registrationNumber}
            onChange={onChange}
            placeholder="Enter registration number"
          />
          <p style={helperTextStyle}>
            Enter the registration number mentioned on your registration document.
            If you are not a registered business, enter your PAN number.
            This will be used for invoice purposes.
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            Registration Certificate
            <Required />
          </label>
          <input
            type="file"
            name="registrationCertificate"
            className="input-field"
            style={fileInputStyle}
            accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg,image/webp"
            onChange={onDocumentChange}
          />
          <ExistingDocHint
            show={existingDocs.registrationCertificate && !documents.registrationCertificate}
          />
          <FilePreviewLink
            file={documents.registrationCertificate}
            docPath={existingDocPaths.registrationCertificate}
            baseUrl={baseUrl}
            label="View uploaded certificate"
          />
          <p style={helperTextStyle}>
            If you don't have a registration certificate, please upload your PAN in PDF format.
          </p>
        </div>

        {/* Row 3 — PAN Number + PAN Image */}
        <div>
          <label style={labelStyle}>
            Organization PAN Number
            <Required />
          </label>
          <input
            type="text"
            name="orgPanNumber"
            className="input-field"
            value={form.orgPanNumber}
            onChange={onChange}
            placeholder="AAAAA9999A"
            maxLength={10}
            style={{
              borderColor:
                panValidation.status === 'success'
                  ? 'var(--color-success, #22c55e)'
                  : panValidation.status === 'error'
                  ? '#ef4444'
                  : undefined,
            }}
          />
          <ValidationFeedback
            status={panValidation.status}
            message={panValidation.message}
          />
          <p style={helperTextStyle}>
            Add your personal PAN if you are not a registered business.
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            PAN Document
            <Required />
          </label>
          <input
            type="file"
            name="orgPanImage"
            className="input-field"
            style={fileInputStyle}
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={onDocumentChange}
          />
          <ExistingDocHint show={existingDocs.orgPanImage && !documents.orgPanImage} />
          <FilePreviewLink
            file={documents.orgPanImage}
            docPath={existingDocPaths.orgPanImage}
            baseUrl={baseUrl}
            label="View uploaded PAN document"
          />
        </div>

        {/* Row 4 — GST Number + GST Image (both optional) */}
        <div>
          <label style={labelStyle}>
            GST Number
          </label>
          <input
            type="text"
            name="gstNumber"
            className="input-field"
            value={form.gstNumber}
            onChange={onChange}
            placeholder="15-digit GSTIN"
            maxLength={15}
            style={{
              borderColor:
                gstValidation.status === 'success'
                  ? 'var(--color-success, #22c55e)'
                  : gstValidation.status === 'error'
                  ? '#ef4444'
                  : undefined,
            }}
          />
          <ValidationFeedback
            status={gstValidation.status}
            message={gstValidation.message}
          />
          <p style={helperTextStyle}>
            GST is not compulsory.
          </p>
        </div>

        <div>
          <label style={labelStyle}>
            GST Document
          </label>
          <input
            type="file"
            name="gstImage"
            className="input-field"
            style={fileInputStyle}
            accept="image/jpeg,image/png,image/jpg,image/webp"
            onChange={onDocumentChange}
          />
          <ExistingDocHint show={existingDocs.gstImage && !documents.gstImage} />
          <FilePreviewLink
            file={documents.gstImage}
            docPath={existingDocPaths.gstImage}
            baseUrl={baseUrl}
            label="View uploaded GST document"
          />
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .business-docs-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
