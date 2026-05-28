import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import getCroppedImg from '../../utils/cropImage';
import api from '../../utils/api';

const SellerKYC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Step 1 Data
  const [step1Data, setStep1Data] = useState({
    elevatorPitch: '',
    officialName: '',
    entityType: 'entity 1',
    storeAddresses: '',
  });
  const [logo, setLogo] = useState(null);

  const [zoom, setZoom] = useState(1);
  const [showCropper, setShowCropper] = useState(false);
  const [logoSrc, setLogoSrc] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setLogoSrc(imageDataUrl);
      setShowCropper(true);
    }
    e.target.value = ''; // reset input so they can re-select the same file if needed
  };

  const showCroppedImage = async () => {
    try {
      // Create a dummy pixel crop based on center zoom since we are using the native fallback
      const img = new Image();
      img.src = logoSrc;
      await new Promise(r => img.onload = r);
      
      const width = img.width / zoom;
      const height = img.height / zoom;
      const x = (img.width - width) / 2;
      const y = (img.height - height) / 2;
      
      const pseudoCroppedAreaPixels = { x, y, width, height };

      const croppedImageBlob = await getCroppedImg(logoSrc, pseudoCroppedAreaPixels, 0);
      const croppedFile = new File([croppedImageBlob], "logo.jpg", { type: "image/jpeg" });
      
      setLogo(croppedFile);
      setLogoPreview(URL.createObjectURL(croppedImageBlob));
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      setShowCropper(false);
    }
  };

  // Step 2 Data
  const [step2Data, setStep2Data] = useState({
    dateOfRegistration: '',
    adminCostPercentage: '',
    registrationNumber: '',
    orgPanNumber: '',
    gstNumber: '',
    agreedToTerms: false,
  });
  const [documents, setDocuments] = useState({
    registrationCertificate: null,
    orgPanImage: null,
    cancelledCheckImage: null,
    gstImage: null,
  });

  const handleStep1Change = (e) => {
    setStep1Data({ ...step1Data, [e.target.name]: e.target.value });
  };

  const handleStep2Change = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setStep2Data({ ...step2Data, [e.target.name]: value });
  };

  const handleDocumentChange = (e) => {
    setDocuments({ ...documents, [e.target.name]: e.target.files[0] });
  };

  const submitStep1 = async () => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('elevatorPitch', step1Data.elevatorPitch);
      formData.append('officialName', step1Data.officialName);
      formData.append('entityType', step1Data.entityType);
      
      const addressesArray = step1Data.storeAddresses.split('\n').filter(a => a.trim() !== '');
      // Send multiple addresses under the same key; backend will normalize.
      addressesArray.forEach((addr) => formData.append('storeAddresses', addr));
      
      if (logo) formData.append('logo', logo);

      await api.post('/seller/kyc/step1', formData);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit step 1');
    } finally {
      setLoading(false);
    }
  };

  const submitStep2 = async () => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      Object.keys(step2Data).forEach(key => {
        formData.append(key, step2Data[key]);
      });
      
      Object.keys(documents).forEach(key => {
        if (documents[key]) formData.append(key, documents[key]);
      });

      await api.post('/seller/kyc/step2', formData);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit step 2');
    } finally {
      setLoading(false);
    }
  };

  const finalizeKYC = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.post('/seller/kyc/submit');
      navigate('/seller/profile');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to finalize KYC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Complete Your KYC</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span className={`badge ${step >= 1 ? 'badge-success' : 'badge-warning'}`}>Step 1</span>
          <span className={`badge ${step >= 2 ? 'badge-success' : 'badge-warning'}`}>Step 2</span>
          <span className={`badge ${step >= 3 ? 'badge-success' : 'badge-warning'}`}>Review</span>
        </div>
      </div>

      {error && (
        <div className="badge-error" style={{ padding: '1rem', marginBottom: '1rem', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3>Organization Details</h3>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Official Name <span style={{ color: 'red' }}>*</span></label>
            <input type="text" name="officialName" className="input-field" value={step1Data.officialName} onChange={handleStep1Change} placeholder="Company Legal Name" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Entity Type <span style={{ color: 'red' }}>*</span></label>
            <select name="entityType" className="input-field" value={step1Data.entityType} onChange={handleStep1Change}>
              <option value="entity 1">Entity 1</option>
              <option value="entity 2">Entity 2</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Elevator Pitch <span style={{ color: 'red' }}>*</span></label>
            <textarea name="elevatorPitch" className="input-field" value={step1Data.elevatorPitch} onChange={handleStep1Change} rows={3} placeholder="Brief description of your business..." />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Store Addresses (One per line) <span style={{ color: 'red' }}>*</span></label>
            <textarea name="storeAddresses" className="input-field" value={step1Data.storeAddresses} onChange={handleStep1Change} rows={3} placeholder="123 Main St, City, Country" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Organization Logo <span style={{ color: 'red' }}>*</span></label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: 'var(--color-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <input type="file" onChange={onFileChange} accept="image/*" />
              {logoPreview && <img src={logoPreview} alt="Cropped preview" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={submitStep1} disabled={loading}>
              {loading ? 'Saving...' : 'Next Step'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3>Business Documents</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Date of registration <span style={{ color: 'red' }}>*</span></label>
              <input type="date" name="dateOfRegistration" className="input-field" value={step2Data.dateOfRegistration} onChange={handleStep2Change} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Admin cost (percentage) <span style={{ color: 'red' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input type="number" step="0.1" name="adminCostPercentage" className="input-field" value={step2Data.adminCostPercentage} onChange={handleStep2Change} style={{ paddingRight: '2rem' }} />
                <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Registration Number <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="registrationNumber" className="input-field" value={step2Data.registrationNumber} onChange={handleStep2Change} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Registration Certificate <span style={{ color: 'red' }}>*</span></label>
              <input type="file" name="registrationCertificate" className="input-field" onChange={handleDocumentChange} accept=".pdf,image/*" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Organization PAN Number <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="orgPanNumber" className="input-field" value={step2Data.orgPanNumber} onChange={handleStep2Change} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>PAN Image <span style={{ color: 'red' }}>*</span></label>
              <input type="file" name="orgPanImage" className="input-field" onChange={handleDocumentChange} accept=".pdf,image/*" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>GST Number <span style={{ color: 'red' }}>*</span></label>
              <input type="text" name="gstNumber" className="input-field" value={step2Data.gstNumber} onChange={handleStep2Change} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>GST Image <span style={{ color: 'red' }}>*</span></label>
              <input type="file" name="gstImage" className="input-field" onChange={handleDocumentChange} accept=".pdf,image/*" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Cancelled Check Image <span style={{ color: 'red' }}>*</span></label>
            <input type="file" name="cancelledCheckImage" className="input-field" onChange={handleDocumentChange} accept=".pdf,image/*" />
          </div>

          <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Agreement</h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <li>I am authorised to represent the organisation listed above</li>
              <li>The information provided is accurate and true and approved by the founder/CEO</li>
              <li>The organisation agrees to use the funds raised from FundCorps platform for its intended purpose only</li>
              <li>The organisation will comply with all applicable laws and regulations</li>
              <li>The organisation will keep its login credentials and account information secure</li>
              <li>The platform can store and use the organisation's information for its operations</li>
              <li>The organisation understands that the platform may verify the information provided</li>
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
            <input type="checkbox" name="agreedToTerms" checked={step2Data.agreedToTerms} onChange={handleStep2Change} id="terms" style={{ width: '1.2rem', height: '1.2rem' }} />
            <label htmlFor="terms" style={{ fontWeight: 'bold' }}>I agree to the Terms and Conditions</label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} disabled={loading}>
              <ArrowLeft size={18} /> Back
            </button>
            <button className="btn btn-primary" onClick={submitStep2} disabled={loading}>
              {loading ? 'Saving...' : 'Review Details'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <CheckCircle size={32} color="var(--color-success)" />
            <h3>Review Your Details</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Organization Details</h4>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
                <li><strong style={{ color: 'var(--color-text)' }}>Official Name:</strong> {step1Data.officialName || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Entity Type:</strong> {step1Data.entityType || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Elevator Pitch:</strong> {step1Data.elevatorPitch || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Store Addresses:</strong> {step1Data.storeAddresses || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Logo:</strong> {logo ? logo.name : 'Not provided'}</li>
              </ul>
            </div>
            
            <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Business Documents</h4>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--color-text-muted)' }}>
                <li><strong style={{ color: 'var(--color-text)' }}>Date of Registration:</strong> {step2Data.dateOfRegistration || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Admin Cost:</strong> {step2Data.adminCostPercentage ? step2Data.adminCostPercentage + '%' : 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Registration Number:</strong> {step2Data.registrationNumber || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>PAN Number:</strong> {step2Data.orgPanNumber || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>GST Number:</strong> {step2Data.gstNumber || 'N/A'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Agreed to Terms:</strong> {step2Data.agreedToTerms ? 'Yes' : 'No'}</li>
                <li><strong style={{ color: 'var(--color-text)' }}>Documents Attached:</strong> {Object.values(documents).filter(d => d).length} files</li>
              </ul>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)} disabled={loading}>
              <ArrowLeft size={18} /> Edit Details
            </button>
            <button className="btn btn-primary" onClick={finalizeKYC} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Verification'}
            </button>
          </div>
        </div>
      )}

      {showCropper && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ position: 'relative', width: '100%', height: '300px', backgroundColor: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Native Zoomable Image Fallback since npm install failed */}
              <img 
                src={logoSrc} 
                alt="Logo" 
                style={{ 
                  transform: `scale(${zoom})`, 
                  transformOrigin: 'center center',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain' 
                }} 
              />
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '200px', height: '200px', border: '2px solid white', boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)' }}></div>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem', background: 'white', color: '#333' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#999', letterSpacing: '1px' }}>ZOOM</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(e.target.value)}
                  style={{ flex: 1, accentColor: '#ff7a3d' }}
                />
              </div>

              <div style={{ display: 'flex', justifyItems: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowCropper(false)}
                  style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#333', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}
                >
                  CANCEL
                </button>
                <button 
                  onClick={showCroppedImage}
                  style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'white', background: '#0a192f', border: 'none', borderRadius: '2rem', padding: '0.8rem 1.5rem', cursor: 'pointer' }}
                >
                  PERFECT! SAVE IT.
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
