import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import ProductRichTextEditor from './ProductRichTextEditor';
import {
  POLICY_TERMS_MAX,
  CARE_INSTRUCTIONS_MAX,
  DEFAULT_POLICIES,
  clonePolicies,
  getCareInstructionsValidation,
  alertNoLinks,
  hasExternalLinks,
} from '../../utils/productContentValidation';

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

const POLICY_ROWS = [
  { key: 'return', label: 'Return', placeholder: 'Mention the terms for return' },
  { key: 'replacement', label: 'Replacement', placeholder: 'Mention the terms for replacement' },
  { key: 'refund', label: 'Refund', placeholder: 'Mention the terms for refund' },
];

function PolicyRow({ policyKey, label, placeholder, productData, setProductData }) {
  const policies = clonePolicies(productData.policies);
  const policy = policies[policyKey] || DEFAULT_POLICIES[policyKey];
  const isOn = policy.enabled === true;
  const charCount = Math.min((policy.terms || '').length, POLICY_TERMS_MAX);

  const updatePolicy = (patch) => {
    setProductData((prev) => {
      const current = clonePolicies(prev.policies);
      return {
        ...prev,
        policies: {
          ...current,
          [policyKey]: { ...current[policyKey], ...patch },
        },
      };
    });
  };

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextEnabled = !isOn;
    updatePolicy({
      enabled: nextEnabled,
      terms: nextEnabled ? policy.terms : '',
    });
  };

  const handleTermsChange = (raw) => {
    if (!isOn) return;
    let val = raw;
    if (hasExternalLinks(val)) {
      alertNoLinks();
      val = val.replace(
        /(?:https?:\/\/|www\.\w+)|\b[a-z0-9][-a-z0-9]*\.(com|org|net|io|co|in|edu|gov|uk|us|info|biz)\b/gi,
        ''
      );
    }
    updatePolicy({ terms: val.slice(0, POLICY_TERMS_MAX) });
  };

  const handlePaste = (e) => {
    if (!isOn) {
      e.preventDefault();
      return;
    }
    const pasted = e.clipboardData?.getData('text') || '';
    if (hasExternalLinks(pasted)) {
      e.preventDefault();
      alertNoLinks();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 py-4 border-b border-[#E1E3E5] last:border-0">
      <div className="flex items-center gap-3 shrink-0 sm:pt-2 sm:min-w-[140px]">
        <button
          type="button"
          role="switch"
          aria-checked={isOn}
          onClick={handleToggle}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
            isOn ? 'bg-[#008060]' : 'bg-[#C9CCCF]'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              isOn ? 'translate-x-5' : ''
            }`}
          />
        </button>
        <span className="text-[14px] font-medium text-[#202223]">{label}</span>
      </div>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          disabled={!isOn}
          className={`w-full border rounded-md px-3 py-2 text-[14px] outline-none placeholder:text-[#6D7175] ${
            isOn
              ? 'border-[#8C9196] bg-white text-[#202223] focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]'
              : 'border-[#E1E3E5] bg-[#F6F6F7] text-[#6D7175] cursor-not-allowed'
          }`}
          placeholder={isOn ? placeholder : 'Turn on the switch to add policy terms'}
          value={isOn ? policy.terms : ''}
          onChange={(e) => handleTermsChange(e.target.value)}
          onPaste={handlePaste}
          maxLength={POLICY_TERMS_MAX}
        />
        {isOn && (
          <p className="text-[12px] text-[#6D7175] mt-1">
            {charCount}/{POLICY_TERMS_MAX} characters used
          </p>
        )}
      </div>
    </div>
  );
}

export default function ProductPolicyCareFields({ productData, setProductData }) {
  const careValidation = getCareInstructionsValidation(productData.careInstructions || '');
  const handleCareChange = (val) => {
    setProductData((prev) => ({ ...prev, careInstructions: val }));
  };

  const handleKeyHighlightsChange = (val) => {
    setProductData((prev) => ({ ...prev, keyHighlights: val }));
  };

  return (
    <div className="space-y-8 pt-6 border-t border-[#E1E3E5]">
      <div>
        <h3 className="text-[16px] font-semibold text-[#202223] mb-1">Policy</h3>
        <div className="mt-2">
          {POLICY_ROWS.map((row) => (
            <PolicyRow
              key={row.key}
              policyKey={row.key}
              label={row.label}
              placeholder={row.placeholder}
              productData={productData}
              setProductData={setProductData}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-[16px] font-semibold text-[#202223] mb-2">
          Care Instructions
        </label>
        <ProductRichTextEditor
          key="care-instructions-editor"
          value={productData.careInstructions || ''}
          onChange={handleCareChange}
        />
        <p className="text-[12px] text-[#6D7175] mt-1">
          {Math.min(careValidation.len, CARE_INSTRUCTIONS_MAX)}/{CARE_INSTRUCTIONS_MAX}{' '}
          characters used
        </p>
        <ValidationHints validation={careValidation} maxLen={CARE_INSTRUCTIONS_MAX} />
      </div>

      <div>
        <label className="block text-[16px] font-semibold text-[#202223] mb-2">
          Key Highlights/USP
        </label>
        <ProductRichTextEditor
          key="key-highlights-editor"
          value={productData.keyHighlights || ''}
          onChange={handleKeyHighlightsChange}
          placeholder="Enter key highlights or unique selling points..."
        />
      </div>
    </div>
  );
}
