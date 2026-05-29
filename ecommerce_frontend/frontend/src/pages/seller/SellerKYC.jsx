import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';
import api, { BASE_URL } from '../../utils/api';
import BusinessDocumentsFields from '../../components/seller/BusinessDocumentsFields';

const LOGO_ACCEPT = 'image/jpeg,image/png,image/jpg';

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: 'var(--color-text-muted)',
  fontWeight: 'bold',
};

const SellerKYC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [entityTypes, setEntityTypes] = useState([]);
  const [entityTypesLoading, setEntityTypesLoading] = useState(true);
  const [existingLogoPath, setExistingLogoPath] = useState('');

  const [form, setForm] = useState({
    elevatorPitch: '',
    officialName: '',
    entityType: '',
    entityTypeOther: '',
    storeAddresses: '',
    dateOfRegistration: '',
    adminCostPercentage: '',
    registrationNumber: '',
    orgPanNumber: '',
    gstNumber: '',
    agreedToTerms: false,
  });

  const [logo, setLogo] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    orgPanImage: null,
    gstImage: null,
  });

  const [existingDocs, setExistingDocs] = useState({
    registrationCertificate: false,
    orgPanImage: false,
    gstImage: false,
  });

  const selectedEntityType = useMemo(
    () => entityTypes.find((t) => t.code === form.entityType),
    [entityTypes, form.entityType]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [typesRes, profileRes] = await Promise.all([
          api.get('/seller/kyc/entity-types'),
          api.get('/seller/profile').catch(() => null),
        ]);
        const types = typesRes.data.entityTypes || [];
        setEntityTypes(types);
        const validCodes = new Set(types.map((t) => t.code));

        const profile = profileRes?.data;
        if (profile) {
          let entityType = profile.entityType || '';
          if (entityType && !validCodes.has(entityType)) {
            entityType = types[0]?.code ?? '';
          }
          if (!entityType) {
            entityType = types[0]?.code ?? '';
          }

          const dateStr = profile.dateOfRegistration
            ? new Date(profile.dateOfRegistration).toISOString().slice(0, 10)
            : '';

          setForm((prev) => ({
            ...prev,
            elevatorPitch: profile.elevatorPitch || prev.elevatorPitch,
            officialName: profile.officialName || prev.officialName,
            entityType,
            entityTypeOther: profile.entityTypeOther || '',
            storeAddresses: Array.isArray(profile.storeAddresses)
              ? profile.storeAddresses.join('\n')
              : prev.storeAddresses,
            dateOfRegistration: dateStr,
            adminCostPercentage: String(
              profile.adminCostPercentage ?? profile.defaultPlatformFeePercent ?? ''
            ),
            registrationNumber: profile.registrationNumber || '',
            orgPanNumber: profile.orgPanNumber || '',
            gstNumber: profile.gstNumber || '',
            agreedToTerms: Boolean(profile.agreedToTerms),
          }));

          if (profile.organizationLogo) {
            setExistingLogoPath(profile.organizationLogo);
            setLogoPreview(`${BASE_URL}/${profile.organizationLogo.replace(/\\/g, '/')}`);
          }

          setExistingDocs({
            registrationCertificate: Boolean(profile.registrationCertificate),
            orgPanImage: Boolean(profile.orgPanImage),
            gstImage: Boolean(profile.gstImage),
          });

          if (profile.kycStatus === 'pending' || profile.status === 'kyc_submitted') {
            setSubmitted(true);
          }
        } else if (types.length) {
          setForm((prev) => ({
            ...prev,
            entityType: types[0].code,
            adminCostPercentage: prev.adminCostPercentage || '12.39',
          }));
        }
      } catch {
        setError('Could not load KYC form. Please refresh the page.');
      } finally {
        setEntityTypesLoading(false);
      }
    };
    load();
  }, []);

  const readFile = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });

  const onLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
    if (!ok) {
      setError('Organization logo must be PNG or JPG format.');
      e.target.value = '';
      return;
    }
    const imageDataUrl = await readFile(file);
    setLogoSrc(imageDataUrl);
    setShowCropper(true);
    e.target.value = '';
  };

  const showCroppedImage = async () => {
    try {
      const img = new Image();
      img.src = logoSrc;
      await new Promise((r) => {
        img.onload = r;
      });
      const width = img.width / zoom;
      const height = img.height / zoom;
      const x = (img.width - width) / 2;
      const y = (img.height - height) / 2;
      const croppedImageBlob = await getCroppedImg(logoSrc, { x, y, width, height }, 0);
      const croppedFile = new File([croppedImageBlob], 'logo.jpg', { type: 'image/jpeg' });
      setLogo(croppedFile);
      setLogoPreview(URL.createObjectURL(croppedImageBlob));
      setShowCropper(false);
      setError(null);
    } catch (e) {
      console.error(e);
      setShowCropper(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDocumentChange = (e) => {
    const file = e.target.files?.[0];
    const name = e.target.name;
    if (!file) return;

    const imageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const certTypes = [...imageTypes, 'application/pdf'];

    if (name === 'registrationCertificate') {
      if (!certTypes.includes(file.type)) {
        setError('Registration Certificate must be a PDF or image (JPG, PNG, or WebP).');
        e.target.value = '';
        return;
      }
    } else if (name === 'orgPanImage' || name === 'gstImage') {
      if (!imageTypes.includes(file.type)) {
        setError(`${name === 'orgPanImage' ? 'PAN Image' : 'GST Image'} must be an image (JPG, PNG, or WebP).`);
        e.target.value = '';
        return;
      }
    }

    setDocuments((prev) => ({ ...prev, [name]: file }));
    setError(null);
  };

  const hasLogo = Boolean(logo || existingLogoPath);
  const hasDoc = (key) => Boolean(documents[key] || existingDocs[key]);

  const canSubmit = useMemo(() => {
    if (!form.officialName.trim()) return false;
    if (!form.entityType) return false;
    if (selectedEntityType?.requiresOtherText && !form.entityTypeOther.trim()) return false;
    if (!form.elevatorPitch.trim()) return false;
    if (!form.storeAddresses.trim()) return false;
    if (!hasLogo) return false;
    if (!form.dateOfRegistration) return false;
    if (!form.registrationNumber.trim()) return false;
    if (!hasDoc('registrationCertificate')) return false;
    if (!form.orgPanNumber.trim()) return false;
    if (!hasDoc('orgPanImage')) return false;
    if (!form.gstNumber.trim()) return false;
    if (!hasDoc('gstImage')) return false;
    if (form.adminCostPercentage === '' || form.adminCostPercentage == null) return false;
    if (!form.agreedToTerms) return false;
    return true;
  }, [form, selectedEntityType, hasLogo, documents, existingDocs]);

  const submitKyc = async () => {
    if (!canSubmit) {
      setError('Please complete all required fields and agree to the Terms and Conditions.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('officialName', form.officialName.trim());
      formData.append('entityType', form.entityType);
      if (selectedEntityType?.requiresOtherText) {
        formData.append('entityTypeOther', form.entityTypeOther.trim());
      }
      formData.append('elevatorPitch', form.elevatorPitch.trim());
      formData.append('dateOfRegistration', form.dateOfRegistration);
      formData.append('adminCostPercentage', String(form.adminCostPercentage));
      formData.append('registrationNumber', form.registrationNumber.trim());
      formData.append('orgPanNumber', form.orgPanNumber.trim());
      formData.append('gstNumber', form.gstNumber.trim());
      formData.append('agreedToTerms', 'true');

      form.storeAddresses
        .split('\n')
        .map((a) => a.trim())
        .filter(Boolean)
        .forEach((addr) => formData.append('storeAddresses', addr));

      if (logo) formData.append('logo', logo);
      Object.entries(documents).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });

      await api.post('/seller/kyc/complete', formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="glass-panel animate-fade-in"
        style={{ padding: '2rem', maxWidth: '640px', margin: '2rem auto', textAlign: 'center' }}
      >
        <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          KYC submitted
        </h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Your verification is under review. We will notify you once approved.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/seller/profile')}>
          Go to profile
        </button>
      </div>
    );
  }

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{ padding: '2rem', maxWidth: '900px', margin: '2rem auto' }}
    >
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
        Complete Your KYC
      </h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        Fill in your organisation details and upload documents on this page. All fields marked with *
        are required.
      </p>

      {error && (
        <div
          className="badge-error"
          style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Organization details
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={labelStyle}>
                Official Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                name="officialName"
                className="input-field"
                value={form.officialName}
                onChange={handleChange}
                placeholder="Company legal name"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Entity Type <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="entityType"
                className="input-field"
                value={form.entityType}
                onChange={handleChange}
                disabled={entityTypesLoading || entityTypes.length === 0}
              >
                {entityTypesLoading && <option value="">Loading…</option>}
                {!entityTypesLoading &&
                  entityTypes.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
              </select>
            </div>

            {selectedEntityType?.requiresOtherText && (
              <div>
                <label style={labelStyle}>
                  Please specify <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  name="entityTypeOther"
                  className="input-field"
                  value={form.entityTypeOther}
                  onChange={handleChange}
                  placeholder="Describe your entity type"
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>
                Elevator Pitch <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="elevatorPitch"
                className="input-field"
                value={form.elevatorPitch}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of your business…"
              />
            </div>

            <div>
              <label style={labelStyle}>
                Store Address <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="storeAddresses"
                className="input-field"
                value={form.storeAddresses}
                onChange={handleChange}
                rows={3}
                placeholder="123 Main St, City, Country"
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
                One address per line. Free sellers: one address only.
              </p>
            </div>

            <div>
              <label style={labelStyle}>
                Organization Logo (PNG or JPG) <span style={{ color: 'red' }}>*</span>
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  background: 'var(--color-surface)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <input type="file" onChange={onLogoChange} accept={LOGO_ACCEPT} />
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{
                      width: '56px',
                      height: '56px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-md)',
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <BusinessDocumentsFields
          form={form}
          documents={documents}
          existingDocs={existingDocs}
          onChange={handleChange}
          onDocumentChange={handleDocumentChange}
        />

        <section
          style={{
            padding: '1.5rem',
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--glass-border)',
          }}
        >
          <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Agreement</h4>
          <ul
            style={{
              listStyleType: 'disc',
              paddingLeft: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              color: 'var(--color-text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <li>I am authorised to represent the organisation listed</li>
            <li>The information provided is accurate and true</li>
            <li>We will comply to all applicable laws and regulations</li>
            <li>The platform can store and use the information for its operations</li>
          </ul>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginTop: '1.25rem' }}>
            <input
              type="checkbox"
              name="agreedToTerms"
              checked={form.agreedToTerms}
              onChange={handleChange}
              id="kyc-terms"
              style={{ width: '1.2rem', height: '1.2rem', marginTop: '0.15rem' }}
            />
            <label htmlFor="kyc-terms" style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Terms and Conditions
              </Link>
            </label>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={submitKyc}
            disabled={loading || !canSubmit}
            style={{ opacity: !canSubmit && !loading ? 0.55 : 1 }}
          >
            {loading ? 'Submitting…' : 'Submit for verification'}
          </button>
        </div>
      </div>

      {showCropper && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '1rem',
              overflow: 'hidden',
              width: '100%',
              maxWidth: '500px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                backgroundColor: '#333',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={logoSrc}
                alt="Logo"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '200px',
                    height: '200px',
                    border: '2px solid white',
                    boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)',
                  }}
                />
              </div>
            </div>

            <div style={{ padding: '1.5rem', background: 'white', color: '#333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#999' }}>ZOOM</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(e.target.value)}
                  style={{ flex: 1, accentColor: '#ff7a3d' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setShowCropper(false)}
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showCroppedImage}
                  style={{
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    color: 'white',
                    background: '#0a192f',
                    border: 'none',
                    borderRadius: '2rem',
                    padding: '0.8rem 1.5rem',
                    cursor: 'pointer',
                  }}
                >
                  Save logo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerKYC;
