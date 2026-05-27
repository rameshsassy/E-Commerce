import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';

const DELIVERY_OPTIONS = [
  { value: '', label: 'Select delivery type' },
  { value: 'pincode', label: 'Pin-codes' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'all_india', label: 'All over India' },
];

export default function DeliveryByFields({ productData, setProductData }) {
  const [suggestions, setSuggestions] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const wrapRef = useRef(null);

  const deliveryBy = productData.deliveryBy || '';
  const deliveryInput = productData.deliveryInput || '';
  const selectedValues = productData.deliveryValues || [];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!['city', 'state', 'all_india'].includes(deliveryBy)) {
      setSuggestions([]);
      return;
    }
    if (deliveryInput.trim().length < 1) {
      setSuggestions([]);
      setTotalMatches(0);
      setHasMoreSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const { data } = await api.get('/products/shipping/suggestions', {
          params: { scope: deliveryBy === 'all_india' ? 'all_india' : deliveryBy, q: deliveryInput.trim() },
        });
        setSuggestions(data.suggestions || []);
        setTotalMatches(data.totalMatches ?? (data.suggestions || []).length);
        setHasMoreSuggestions(!!data.hasMore);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Delivery suggestions:', err);
        setSuggestions([]);
        setTotalMatches(0);
        setHasMoreSuggestions(false);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [deliveryBy, deliveryInput]);

  const handleDeliveryByChange = (value) => {
    setProductData({
      ...productData,
      deliveryBy: value,
      deliveryInput: '',
      deliveryValues: [],
    });
    setSuggestions([]);
    setTotalMatches(0);
    setHasMoreSuggestions(false);
    setShowSuggestions(false);
  };

  const addValue = (value) => {
    const v = String(value).trim();
    if (!v) return;
    if (selectedValues.includes(v)) return;
    setProductData({
      ...productData,
      deliveryValues: [...selectedValues, v],
      deliveryInput: '',
    });
    setShowSuggestions(false);
  };

  const removeValue = (value) => {
    setProductData({
      ...productData,
      deliveryValues: selectedValues.filter((x) => x !== value),
    });
  };

  const commitPincodeInput = () => {
    const pins = deliveryInput
      .split(/[,;\s]+/)
      .map((p) => p.trim())
      .filter((p) => /^\d{6}$/.test(p));
    if (pins.length === 0) return;
    const merged = [...new Set([...selectedValues, ...pins])];
    setProductData({
      ...productData,
      deliveryValues: merged,
      deliveryInput: '',
    });
  };

  const fieldLabels = {
    pincode: 'Delivery by pin-codes',
    city: 'Enter city name',
    state: 'Enter state name',
    all_india: 'All over India — select region',
  };

  const fieldPlaceholders = {
    pincode: 'e.g. 400001, 110001 (comma separated, 6 digits)',
    city: 'Type M to see all cities starting with M',
    state: 'Type M to see all states starting with M',
    all_india: 'Type N to see regions starting with N (e.g. North India)',
  };

  return (
    <div className="col-span-1 sm:col-span-2 mt-2">
      <label className="block text-[13px] text-[#202223] mb-1 font-medium">Delivery by</label>
      <select
        className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] mb-3"
        value={deliveryBy}
        onChange={(e) => handleDeliveryByChange(e.target.value)}
      >
        {DELIVERY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <ul className="text-[12px] text-[#6D7175] mb-3 list-disc list-inside">
        <li>Pin-codes</li>
        <li>City</li>
        <li>State</li>
        <li>All over India</li>
      </ul>

      {deliveryBy && (
        <div ref={wrapRef}>
          <label className="block text-[13px] text-[#202223] mb-1">
            {fieldLabels[deliveryBy]}
          </label>

          {deliveryBy === 'pincode' ? (
            <div>
              <input
                type="text"
                className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3]"
                placeholder={fieldPlaceholders.pincode}
                value={deliveryInput}
                onChange={(e) =>
                  setProductData({ ...productData, deliveryInput: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commitPincodeInput();
                  }
                }}
                onBlur={commitPincodeInput}
              />
              <p className="text-[11px] text-[#6D7175] mt-1">Press Enter or leave field to add pincodes</p>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3]"
                placeholder={fieldPlaceholders[deliveryBy]}
                value={deliveryInput}
                onChange={(e) =>
                  setProductData({ ...productData, deliveryInput: e.target.value })
                }
                onFocus={() => deliveryInput.trim() && setShowSuggestions(true)}
              />
              {deliveryInput.trim().length >= 1 && !loadingSuggestions && totalMatches > 0 && (
                <p className="text-[11px] text-[#6D7175] mt-1">
                  Showing {suggestions.length} of {totalMatches} names starting with &quot;{deliveryInput.trim()}&quot;
                  {hasMoreSuggestions ? ' — scroll the list for more' : ''}
                </p>
              )}
              {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
                <ul className="absolute z-20 w-full mt-1 bg-white border border-[#E1E3E5] rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {loadingSuggestions && (
                    <li className="px-3 py-2 text-[13px] text-[#6D7175]">Searching...</li>
                  )}
                  {!loadingSuggestions && suggestions.length > 0 && (
                    <li className="px-3 py-1.5 text-[11px] text-[#6D7175] bg-[#F6F6F7] border-b border-[#E1E3E5] sticky top-0">
                      Suggestions starting with &quot;{deliveryInput.trim()}&quot;
                    </li>
                  )}
                  {suggestions.map((item) => (
                    <li key={item}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 text-[14px] text-[#202223] hover:bg-[#F6F6F7]"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addValue(item);
                        }}
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {showSuggestions &&
                !loadingSuggestions &&
                deliveryInput.trim().length >= 1 &&
                suggestions.length === 0 && (
                  <p className="text-[12px] text-[#6D7175] mt-1">
                    No {deliveryBy === 'city' ? 'cities' : deliveryBy === 'state' ? 'states' : 'regions'} start with &quot;{deliveryInput.trim()}&quot;. Try another letter.
                  </p>
                )}
            </div>
          )}

          {selectedValues.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedValues.map((val) => (
                <span
                  key={val}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#F6F6F7] border border-[#E1E3E5] text-[13px] text-[#202223]"
                >
                  {val}
                  <button
                    type="button"
                    className="text-[#D82C0D] hover:text-[#A32009] ml-1"
                    onClick={() => removeValue(val)}
                    aria-label={`Remove ${val}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
