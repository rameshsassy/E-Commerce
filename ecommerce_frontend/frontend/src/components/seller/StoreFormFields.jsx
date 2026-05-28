import { useRef } from 'react';
import { Plus, XCircle } from 'lucide-react';
import { BASE_URL } from '../../utils/api';

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
  allowMultipleAddresses = false,
  storeAddressHint = '',
}) {
  const logoInputRef = useRef(null);
  const nameValidation = getTextFieldValidation(storeForm.storeName, STORE_NAME_MAX);
  const addressValidation = getTextFieldValidation(storeForm.detailedAddress, STORE_ADDRESS_MAX);
  const keywordList = parseKeywordsInput(storeForm.keywordsInput);
  const keywordsTooMany = keywordList.length > STORE_KEYWORDS_MAX;
  const keywordsHaveLinks = keywordList.some((k) => hasExternalLinks(k));
  const storeSlug = slugFromStoreName(storeForm.storeName);

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Logo must be JPG or PNG only.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Please use an image under 10MB.');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const updateAdditionalAddress = (index, value) => {
    const next = [...(storeForm.additionalAddresses || [])];
    next[index] = value;
    setStoreForm({ ...storeForm, additionalAddresses: next });
  };

  const addAdditionalAddress = () => {
    if (!allowMultipleAddresses) return;
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

      {/* Logo */}
      <div>
        <div className="flex gap-4 items-start">
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="w-24 h-24 shrink-0 border-2 border-dashed border-[#8C9196] rounded-lg flex items-center justify-center bg-[#F6F6F7] hover:bg-[#F1F2F3] overflow-hidden"
          >
            {displayLogo ? (
              <img src={displayLogo} alt="Store logo" className="w-full h-full object-cover" />
            ) : (
              <Plus size={28} className="text-[#6D7175]" />
            )}
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            className="hidden"
            onChange={handleLogoChange}
          />
          <div className="text-[13px] text-[#202223]">
            <p className="font-medium mb-2">Upload logo</p>
            <ul className="list-disc list-inside text-[#6D7175] space-y-0.5 text-[12px]">
              <li>Square images</li>
              <li>Less than 100 KB in file size</li>
              <li>JPG or PNG format only</li>
            </ul>
          </div>
        </div>
      </div>

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

      {/* Additional addresses — premium sellers only */}
      {allowMultipleAddresses && (
        <>
          {(storeForm.additionalAddresses || []).map((addr, index) => (
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
            <span>Add Store address</span>
            <Plus size={18} />
          </button>
        </>
      )}

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
    </div>
  );
}

export function isStoreFormValid(storeForm, { allowMultipleAddresses = false } = {}) {
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
  return nameOk && addrOk && keywordsOk && extraOk;
}
