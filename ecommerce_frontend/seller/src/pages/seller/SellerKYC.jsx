import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ExternalLink } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';
import { compressAndStandardizeImage } from '../../utils/imageCompression';
import api, { BASE_URL } from '../../utils/api';
import BusinessDocumentsFields from '../../components/seller/BusinessDocumentsFields';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';

const LOGO_ACCEPT = 'image/jpeg,image/png,image/jpg';

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  color: 'var(--color-text-muted)',
  fontWeight: 'bold',
};

// PAN format check (mirrors backend)
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

const SellerKYC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [compressing, setCompressing] = useState(false);

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

  const [existingDocPaths, setExistingDocPaths] = useState({
    registrationCertificate: '',
    orgPanImage: '',
    gstImage: '',
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

          setExistingDocPaths({
            registrationCertificate: profile.registrationCertificate || '',
            orgPanImage: profile.orgPanImage || '',
            gstImage: profile.gstImage || '',
          });

          if (profile.kycStatus === 'pending' || profile.status === 'kyc_submitted') {
            setSubmitted(true);
          }
        } else if (types.length) {
          setForm((prev) => ({
            ...prev,
            entityType: types[0].code,
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
      setCompressing(true);
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
      
      const compressed = await compressAndStandardizeImage(croppedFile);
      setLogo(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
      setShowCropper(false);
      setError(null);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Image could not be optimized. Please upload a different image.');
      setShowCropper(false);
    } finally {
      setCompressing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleDocumentChange = async (e) => {
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
        setError(`${name === 'orgPanImage' ? 'PAN Document' : 'GST Document'} must be an image (JPG, PNG, or WebP).`);
        e.target.value = '';
        return;
      }
    }

    if (imageTypes.includes(file.type)) {
      try {
        setCompressing(true);
        const compressed = await compressAndStandardizeImage(file);
        setDocuments((prev) => ({ ...prev, [name]: compressed }));
        setError(null);
      } catch (err) {
        setError(err.message || 'Image could not be optimized. Please upload a different image.');
        e.target.value = '';
      } finally {
        setCompressing(false);
      }
    } else {
      setDocuments((prev) => ({ ...prev, [name]: file }));
      setError(null);
    }
  };

  const hasLogo = Boolean(logo || existingLogoPath);
  const hasDoc = useCallback((key) => Boolean(documents[key] || existingDocs[key]), [documents, existingDocs]);

  const buildKycFormData = useCallback(
    (includeAgreedTerms = false) => {
      const formData = new FormData();
      if (form.officialName.trim()) formData.append('officialName', form.officialName.trim());
      if (form.entityType) formData.append('entityType', form.entityType);
      if (selectedEntityType?.requiresOtherText && form.entityTypeOther.trim()) {
        formData.append('entityTypeOther', form.entityTypeOther.trim());
      }
      if (form.elevatorPitch.trim()) formData.append('elevatorPitch', form.elevatorPitch.trim());
      if (form.dateOfRegistration) formData.append('dateOfRegistration', form.dateOfRegistration);

      if (form.registrationNumber.trim()) {
        formData.append('registrationNumber', form.registrationNumber.trim());
      }
      if (form.orgPanNumber.trim()) formData.append('orgPanNumber', form.orgPanNumber.trim());
      if (form.gstNumber.trim()) formData.append('gstNumber', form.gstNumber.trim());
      if (includeAgreedTerms) formData.append('agreedToTerms', 'true');
      else if (form.agreedToTerms) formData.append('agreedToTerms', 'true');

      form.storeAddresses
        .split('\n')
        .map((a) => a.trim())
        .filter(Boolean)
        .forEach((addr) => formData.append('storeAddresses', addr));

      if (logo) formData.append('logo', logo);
      Object.entries(documents).forEach(([key, file]) => {
        if (file) formData.append(key, file);
      });
      return formData;
    },
    [form, selectedEntityType, logo, documents]
  );

  const saveKycDraft = useCallback(async () => {
    const formData = buildKycFormData(false);
    const { data } = await api.patch('/seller/kyc/complete', formData);
    return data;
  }, [buildKycFormData]);

  const kycAutosaveValue = useMemo(
    () => ({
      ...form,
      hasLogo: Boolean(logo || existingLogoPath),
      docKeys: Object.keys(documents).filter((k) => documents[k]),
    }),
    [form, logo, existingLogoPath, documents]
  );

  const { status: kycAutosaveStatus, message: kycAutosaveMessage, markSaved: markKycSaved } =
    useFormAutosave({
      formKey: 'seller.kyc.complete',
      value: kycAutosaveValue,
      enabled: !submitted && !entityTypesLoading,
      restore: false,
      saveFn: saveKycDraft,
      isEmpty: (v) =>
        !String(v.officialName || '').trim() &&
        !String(v.elevatorPitch || '').trim() &&
        !String(v.storeAddresses || '').trim(),
    });

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
    // PAN is compulsory and must be valid format
    if (!form.orgPanNumber.trim()) return false;
    if (!PAN_REGEX.test(form.orgPanNumber.trim())) return false;
    if (!hasDoc('orgPanImage')) return false;
    // GST is optional — but if entered, must be valid format and have its document uploaded
    if (form.gstNumber.trim() && !GST_REGEX.test(form.gstNumber.trim())) return false;
    if (form.gstNumber.trim() && !hasDoc('gstImage')) return false;
    if (!form.agreedToTerms) return false;
    return true;
  }, [form, selectedEntityType, hasLogo, hasDoc]);

  const submitKyc = async () => {
    if (!canSubmit) {
      setError('Please complete all required fields and agree to the Terms and Conditions.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = buildKycFormData(true);
      await api.post('/seller/kyc/complete', formData);
      markKycSaved(kycAutosaveValue);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit KYC');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel seller-kyc-success animate-fade-in">
        <CheckCircle size={48} color="var(--color-success)" className="mx-auto mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          KYC submitted
        </h2>
        <p className="text-text-muted mb-6">
          Your verification is under review. We will notify you once approved.
        </p>
        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={() => navigate('/seller/profile')}>
          Go to profile
        </button>
      </div>
    );
  }

  return (
    <div className="glass-panel seller-kyc-shell animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-xl sm:text-2xl font-bold m-0">
          Complete Your KYC
        </h2>
        <FormAutosaveStatus status={kycAutosaveStatus} message={kycAutosaveMessage} />
      </div>
      <p className="text-text-muted mb-6 text-sm sm:text-base">
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
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
                    <button
                      type="button"
                      onClick={() => window.open(logoPreview, '_blank')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-primary, #005bd3)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <ExternalLink size={12} /> Preview
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <BusinessDocumentsFields
          form={form}
          documents={documents}
          existingDocs={existingDocs}
          existingDocPaths={existingDocPaths}
          baseUrl={String(BASE_URL)}
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

        <div className="flex flex-col sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-primary w-full sm:w-auto"
            onClick={submitKyc}
            disabled={loading || !canSubmit}
            style={{ opacity: !canSubmit && !loading ? 0.55 : 1 }}
          >
            {loading ? 'Submitting…' : 'Submit for verification'}
          </button>
        </div>
      </div>

      {showCropper && createPortal(
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
        </div>,
        document.body
      )}

      {compressing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 text-white gap-3">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-medium">Compressing and optimizing document...</p>
        </div>
      )}
    </div>
  );
};

export default SellerKYC;
