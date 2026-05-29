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

const Required = () => <span style={{ color: '#ef4444' }}> *</span>;

function ExistingDocHint({ show }) {
  if (!show) return null;
  return (
    <p style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.35rem' }}>
      Previously uploaded — choose a file to replace
    </p>
  );
}

function PercentInput({ value, onChange }) {
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        name="adminCostPercentage"
        className="input-field"
        value={value}
        onChange={onChange}
        min={0}
        max={100}
        step="0.01"
        placeholder="0"
        style={{ paddingRight: '2.25rem' }}
      />
      <span
        style={{
          position: 'absolute',
          right: '0.875rem',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-text-muted)',
          pointerEvents: 'none',
          fontWeight: 600,
        }}
      >
        %
      </span>
    </div>
  );
}

/**
 * Two-column Business Documents block (date/reg fee, reg no/cert, PAN/PAN image, GST/GST image).
 */
export default function BusinessDocumentsFields({
  form,
  documents,
  existingDocs,
  onChange,
  onDocumentChange,
}) {
  return (
    <section>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.25rem' }}>
        Business Documents
      </h3>

      <div style={gridStyle} className="business-docs-grid">
        {/* Row 1 */}
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
        </div>

        <div>
          <label style={labelStyle}>
            Admin cost (percentage)
            <Required />
          </label>
          <PercentInput
            value={form.adminCostPercentage}
            onChange={onChange}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            Enter a value between 0 and 100.
          </p>
        </div>

        {/* Row 2 */}
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
          />
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
        </div>

        {/* Row 3 */}
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
          />
        </div>

        <div>
          <label style={labelStyle}>
            PAN Image
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
        </div>

        {/* Row 4 */}
        <div>
          <label style={labelStyle}>
            GST Number
            <Required />
          </label>
          <input
            type="text"
            name="gstNumber"
            className="input-field"
            value={form.gstNumber}
            onChange={onChange}
            placeholder="15-digit GSTIN"
          />
        </div>

        <div>
          <label style={labelStyle}>
            GST Image
            <Required />
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
