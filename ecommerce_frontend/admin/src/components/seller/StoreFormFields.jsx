import { useRef, useState } from 'react';
import { Plus, XCircle, Zap, ExternalLink } from 'lucide-react';
import { BASE_URL } from '../../utils/api';
import { compressAndStandardizeImage } from '../../utils/imageCompression';
import StoreSeoPreview from './StoreSeoPreview';

export const STORE_NAME_MAX = 1500;
export const STORE_ADDRESS_MAX = 500;
export const STORE_KEYWORDS_MAX = 5;

const EXTERNAL_LINK_RE =
  /(?:https?:\/\/|www\.\w+)|\b[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|in|edu|gov)\b/i;

export function hasExternalLinks(text) {
  if (!text) return false;
  return EXTERNAL_LINK_RE.test(text);
}

export function slugFromStoreName(name) {
  return (
    (name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'storename'
  );
}

export function getTextFieldValidation(text, maxLen) {
  const len = (text || '').length;
  return {
    len,
    tooLong: len > maxLen,
    externalLinks: hasExternalLinks(text),
    looksGood: len > 0 && len <= maxLen && !hasExternalLinks(text),
  };
}

export function parseKeywordsInput(input) {
  return (input || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function ValidationHints({ validation, maxLen }) {
  return (
    <div className="mt-2 space-y-1">
      {validation.externalLinks && (
        <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5">
          <XCircle size={14} /> No external links allowed
        </p>
      )}
      {validation.tooLong && (
        <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5">
          <XCircle size={14} /> Oops! No more than {maxLen} characters
        </p>
      )}
    </div>
  );
}

export default function StoreFormFields({
  storeForm,
  setStoreForm,
  platformHost,
  storeView,
  logoPreview,
  setLogoPreview,
  setLogoFile,
  existingLogoPath,
  faviconPreview,
  setFaviconPreview,
  setFaviconFile,
  existingFaviconPath,
  sellerMeta = {},
  allowMultipleAddresses = false,
  storeAddressHint = '',
  onRequestUpgrade,
}) {
  const logoInputRef = useRef(null);
  const faviconInputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const nameValidation = getTextFieldValidation(storeForm.storeName, STORE_NAME_MAX);
  const addressValidation = getTextFieldValidation(storeForm.detailedAddress, STORE_ADDRESS_MAX);
  const keywordList = parseKeywordsInput(storeForm.keywordsInput);
  const keywordsTooMany = keywordList.length > STORE_KEYWORDS_MAX;
  const keywordsHaveLinks = keywordList.some((k) => hasExternalLinks(k));
  const storeSlug = slugFromStoreName(storeForm.storeName);

  const validateStoreImage = (file, label) => {
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      alert(`${label} must be JPG, PNG, or WebP.`);
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert(`${label} is too large. Please use an image under 10MB.`);
      return false;
    }
    return true;
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateStoreImage(file, 'Logo')) return;
    try {
      setCompressing(true);
      const compressed = await compressAndStandardizeImage(file);
      setLogoFile(compressed);
      setLogoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      alert(err.message || 'Image could not be optimized. Please upload a different image.');
    } finally {
      setCompressing(false);
    }
  };

  const handleFaviconChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateStoreImage(file, 'Favicon')) return;
    try {
      setCompressing(true);
      const compressed = await compressAndStandardizeImage(file);
      setFaviconFile(compressed);
      setFaviconPreview(URL.createObjectURL(compressed));
    } catch (err) {
      alert(err.message || 'Image could not be optimized. Please upload a different image.');
    } finally {
      setCompressing(false);
    }
  };

  const updateAdditionalAddress = (index, value) => {
    const next = [...(storeForm.additionalAddresses || [])];
    next[index] = value;
    setStoreForm({ ...storeForm, additionalAddresses: next });
  };

  const addAdditionalAddress = () => {
    if (!allowMultipleAddresses) {
      onRequestUpgrade?.('multiple_addresses');
      return;
    }
    setStoreForm({
      ...storeForm,
      additionalAddresses: [...(storeForm.additionalAddresses || []), ''],
    });
  };

  const removeAdditionalAddress = (index) => {
    const next = (storeForm.additionalAddresses || []).filter((_, i) => i !== index);
    setStoreForm({ ...storeForm, additionalAddresses: next });
  };

  const displayLogo =
    logoPreview ||
    (existingLogoPath ? `${BASE_URL}/${existingLogoPath.replace(/\\/g, '/')}` : null);

  const displayFavicon =
    faviconPreview ||
    (existingFaviconPath ? `${BASE_URL}/${existingFaviconPath.replace(/\\/g, '/')}` : null);

  return (
    <div className="space-y-6 max-w-lg text-[#202223]">
      {/* Store name */}
      <div>
        <label className="block text-[14px] font-medium text-[#202223] mb-1">Store name</label>
        <input
          type="text"
          required
          className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
          value={storeForm.storeName}
          onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
          maxLength={STORE_NAME_MAX + 50}
        />
        <p className="text-[12px] text-[#6D7175] mt-2">
          www.{platformHost}/store/{storeSlug}
        </p>
        <div className="mt-3">
          <label className="block text-[12px] text-[#6D7175] mb-1">
            Enter keywords separated by commas
          </label>
          <input
            type="text"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3]"
            value={storeForm.keywordsInput}
            onChange={(e) => setStoreForm({ ...storeForm, keywordsInput: e.target.value })}
            placeholder="organic, handmade, gifts"
          />
          <p className="text-[12px] text-[#6D7175] mt-1">
            {Math.min(keywordList.length, STORE_KEYWORDS_MAX)}/{STORE_KEYWORDS_MAX} keywords used
          </p>
          {keywordsTooMany && (
            <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5 mt-1">
              <XCircle size={14} /> Maximum {STORE_KEYWORDS_MAX} keywords allowed
            </p>
          )}
          {keywordsHaveLinks && (
            <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5 mt-1">
              <XCircle size={14} /> No external links allowed in keywords
            </p>
          )}
        </div>
        <ValidationHints validation={nameValidation} maxLen={STORE_NAME_MAX} />
      </div>

      {/* Logo & favicon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-[14px] font-medium mb-2">
            Store logo <span className="text-[#D82C0D]">*</span>
          </p>
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="w-24 h-24 border-2 border-dashed border-[#8C9196] rounded-lg flex items-center justify-center bg-[#F6F6F7] hover:bg-[#F1F2F3] overflow-hidden"
              >
                {displayLogo ? (
                  <img src={displayLogo} alt="Store logo" className="w-full h-full object-cover" />
                ) : (
                  <Plus size={28} className="text-[#6D7175]" />
                )}
              </button>
              {displayLogo && (
                <button
                  type="button"
                  onClick={() => window.open(displayLogo, '_blank')}
                  className="text-[12px] text-[#005bd3] hover:text-[#004bb4] underline font-medium flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Preview
                </button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
              onChange={handleLogoChange}
            />
            <ul className="list-disc list-inside text-[#6D7175] space-y-0.5 text-[12px]">
              <li>Square images</li>
              <li>Optimized to ≤100 KB on upload</li>
              <li>JPG, PNG, or WebP</li>
            </ul>
          </div>
        </div>

        <div>
          <p className="text-[14px] font-medium mb-2">Favicon</p>
          <div className="flex gap-4 items-start">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => faviconInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed border-[#8C9196] rounded-lg flex items-center justify-center bg-[#F6F6F7] hover:bg-[#F1F2F3] overflow-hidden"
              >
                {displayFavicon ? (
                  <img src={displayFavicon} alt="Favicon" className="w-full h-full object-cover" />
                ) : (
                  <Plus size={22} className="text-[#6D7175]" />
                )}
              </button>
              {displayFavicon && (
                <button
                  type="button"
                  onClick={() => window.open(displayFavicon, '_blank')}
                  className="text-[12px] text-[#005bd3] hover:text-[#004bb4] underline font-medium flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Preview
                </button>
              )}
            </div>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              className="hidden"
              onChange={handleFaviconChange}
            />
            <ul className="list-disc list-inside text-[#6D7175] space-y-0.5 text-[12px]">
              <li>Shown in browser tab</li>
              <li>Square, 32×32 or larger</li>
              <li>Falls back to logo if empty</li>
            </ul>
          </div>
        </div>
      </div>

      <StoreSeoPreview storeForm={storeForm} sellerMeta={sellerMeta} />

      {/* Detailed address */}
      <div>
        <label className="block text-[14px] font-medium text-[#202223] mb-1">
          Store detailed Address
        </label>
        <textarea
          required
          rows={4}
          className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] resize-y"
          value={storeForm.detailedAddress}
          onChange={(e) => setStoreForm({ ...storeForm, detailedAddress: e.target.value })}
          maxLength={STORE_ADDRESS_MAX + 50}
        />
        <p className="text-[12px] text-[#6D7175] mt-1">
          {addressValidation.len}/{STORE_ADDRESS_MAX} characters used
        </p>
        <ValidationHints validation={addressValidation} maxLen={STORE_ADDRESS_MAX} />
        {!allowMultipleAddresses && storeAddressHint && (
          <p className="text-[12px] text-[#6D7175] mt-2">{storeAddressHint}</p>
        )}
      </div>

      {/* Additional addresses — premium; free sellers see upgrade prompt */}
      {allowMultipleAddresses &&
        (storeForm.additionalAddresses || []).map((addr, index) => (
          <div key={index}>
            <label className="block text-[13px] text-[#6D7175] mb-1">
              Additional address {index + 1}
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                className="flex-1 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3]"
                value={addr}
                onChange={(e) => updateAdditionalAddress(index, e.target.value)}
                placeholder="Extra pickup / warehouse address"
                maxLength={STORE_ADDRESS_MAX}
              />
              <button
                type="button"
                onClick={() => removeAdditionalAddress(index)}
                className="text-[#D82C0D] text-sm px-2 shrink-0"
              >
                Remove
              </button>
            </div>
          </div>
        ))}

      <button
        type="button"
        onClick={addAdditionalAddress}
        className="w-full flex items-center justify-between px-4 py-3 rounded-md bg-[#E4E5E7] hover:bg-[#D2D5D8] text-[#202223] text-[14px] font-medium transition-colors"
      >
        <span className="flex items-center gap-2">
          Add Store address
          {!allowMultipleAddresses && (
            <Zap size={16} className="text-[#B98900]" fill="currentColor" aria-hidden />
          )}
        </span>
        {allowMultipleAddresses ? <Plus size={18} /> : <Zap size={18} className="text-[#B98900]" />}
      </button>

      {storeView === 'edit' && (
        <label className="flex items-center gap-2 text-[14px] text-[#202223]">
          <input
            type="checkbox"
            checked={storeForm.isActive}
            onChange={(e) => setStoreForm({ ...storeForm, isActive: e.target.checked })}
          />
          Store is active (visible to customers)
        </label>
      )}

      {/* Store hosting (always platform subdomain) */}
      <div className="pt-2">
        <p className="text-[16px] font-medium mb-2">Store hosting</p>

        <label className="flex items-start gap-2 text-[14px] text-[#202223]">
          <input
            type="radio"
            name="domainType"
            value="platform_subdomain"
            checked
            readOnly
          />
          <div>
            <div className="leading-snug">
              On our website — <span className="font-medium">{`www.${platformHost}/store/${storeSlug}`}</span>
            </div>
          </div>
        </label>
      </div>

      {compressing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 text-white gap-3">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-medium">Compressing and optimizing image...</p>
        </div>
      )}
    </div>
  );
}

export function isStoreFormValid(
  storeForm,
  { allowMultipleAddresses = false, requireLogo = false, hasLogo = false } = {}
) {
  const nameOk = getTextFieldValidation(storeForm.storeName, STORE_NAME_MAX).looksGood;
  const addrOk = getTextFieldValidation(storeForm.detailedAddress, STORE_ADDRESS_MAX).looksGood;
  const keywords = parseKeywordsInput(storeForm.keywordsInput);
  const keywordsOk =
    keywords.length <= STORE_KEYWORDS_MAX && !keywords.some((k) => hasExternalLinks(k));
  const extras = storeForm.additionalAddresses || [];
  const extraOk = allowMultipleAddresses
    ? extras.every(
        (a) => !a.trim() || (!hasExternalLinks(a) && a.length <= STORE_ADDRESS_MAX)
      )
    : !extras.some((a) => a.trim());
  const logoOk = !requireLogo || hasLogo;
  return nameOk && addrOk && keywordsOk && extraOk && logoOk;
}
