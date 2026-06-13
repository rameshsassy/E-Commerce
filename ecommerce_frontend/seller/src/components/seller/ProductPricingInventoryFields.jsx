import { XCircle, ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../utils/api';
import ProductVariantsFields from './ProductVariantsFields';
import ProductShippingFields from './ProductShippingFields';
import { Crown } from 'lucide-react';
import {
  normalizeCategoryPath,
  isCompleteCategoryPath,
  categoryPathsEqual,
  pathFromProductData,
  pathFromApiLocked,
  formatCategoryPathLabel,
} from '../../utils/sellerCategoryPath';

const PremiumCrownIcon = ({ size = 16, className = "inline-block ml-2 align-middle" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M20 68 L25 32 L42 52 L50 22 L58 52 L75 32 L80 68 Z"
      stroke="#B98900"
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M20 76 H80"
      stroke="#B98900"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </svg>
);
import {
  CATEGORY_OTHER_LABEL,
  getMainCategoryOptions,
  getSubcategoriesForSelection,
  getTypesForSelection,
  resolveTaxonomyMainKey,
  resolveTaxonomySubKey,
} from '../../constants/sellerCategoryTaxonomy';
import {
  isOtherCategoryLabel,
  resolveCategorySegment,
  resolveTypeValue,
} from '../../utils/sellerCategoryOther';

function splitPremiumCategoryString(categoryValue) {
  const raw = String(categoryValue || '').trim();
  if (!raw) return { main: '', sub: '' };
  const parts = raw.split('/').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { main: '', sub: '' };
  return { main: parts[0] || '', sub: parts[1] || '' };
}

function FieldError({ show, children }) {
  if (!show) return null;
  return (
    <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5 mt-1">
      <XCircle size={14} /> {children}
    </p>
  );
}

export default function ProductPricingInventoryFields({
  productData,
  setProductData,
  inventoryOptions,
  editingProduct,
  onToggleStoreAddress,
  onRequestUpgrade,
}) {
  const navigate = useNavigate();
  const [storeAddressDraft, setStoreAddressDraft] = useState('');
  const [storeAddressSaving, setStoreAddressSaving] = useState(false);
  const [storeAddressError, setStoreAddressError] = useState('');
  const categoryWrapRef = useRef(null);
  const purchaseTypeRef = useRef(null);
  const [purchaseTypeOpen, setPurchaseTypeOpen] = useState(false);
  const [mainOpen, setMainOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [mainQuery, setMainQuery] = useState('');
  const [subQuery, setSubQuery] = useState('');
  const [typeQuery, setTypeQuery] = useState('');
  const [otherMainText, setOtherMainText] = useState('');
  const [otherSubText, setOtherSubText] = useState('');
  const [otherTypeText, setOtherTypeText] = useState('');
  const maxOrderLimit = inventoryOptions?.maxOrderQuantityLimit ?? 5;
  const categoryLimits = inventoryOptions?.categoryLimits;
  const lockedCategoryPath = useMemo(
    () => pathFromApiLocked(categoryLimits?.lockedCategoryPath),
    [categoryLimits?.lockedCategoryPath]
  );
  const lockedPathLabel =
    categoryLimits?.lockedCategoryPath?.label ||
    (lockedCategoryPath ? formatCategoryPathLabel(lockedCategoryPath) : '');
  const minQty = Number(productData.minOrderQuantity);
  const maxQty = Number(productData.maxOrderQuantity);
  const minInvalid = productData.minOrderQuantity !== '' && productData.minOrderQuantity !== undefined && (minQty < 1 || !Number.isFinite(minQty));
  const maxInvalid =
    productData.maxOrderQuantity !== '' &&
    productData.maxOrderQuantity !== undefined &&
    (maxQty < 1 || !Number.isFinite(maxQty) || maxQty > maxOrderLimit);
  const minGreaterThanMax =
    Number.isFinite(minQty) && Number.isFinite(maxQty) && minQty >= 1 && maxQty >= 1 && minQty > maxQty;

  const purchaseOptions =
    inventoryOptions?.purchaseTypeOptions || [
      { value: 'one_time', label: 'One-time purchase', available: true, note: null },
      { value: 'subscription', label: 'Subscription', available: false, note: 'Only application for subscribed sellers' },
      { value: 'custom_order', label: 'Custom Order', available: false, note: 'Only application for subscribed sellers' },
    ];

  const addressesLocked = editingProduct?.approvalStatus === 'approved';
  const hasStoreAddresses = (inventoryOptions?.storeAddresses || []).length > 0;
  const isPremium = inventoryOptions?.isSubscribedSeller === true;
  const isFreeSeller = !isPremium;

  const promptUpgrade = (feature) => {
    if (isPremium) return false;
    onRequestUpgrade?.(feature, { autoRedirect: true });
    return true;
  };

  const taxonomy = categoryLimits?.taxonomy;

  const { main: selectedMain, sub: selectedSub } = useMemo(() => {
    return splitPremiumCategoryString(productData.category);
  }, [productData.category]);

  const mainKey = resolveTaxonomyMainKey(selectedMain);
  const subKey = resolveTaxonomySubKey(mainKey, selectedSub);

  const mainOptionsList = useMemo(() => {
    return taxonomy?.mains?.length ? taxonomy.mains : getMainCategoryOptions();
  }, [taxonomy]);

  const subOptionsList = useMemo(() => {
    if (!mainKey) return [];
    return getSubcategoriesForSelection(mainKey, taxonomy);
  }, [mainKey, taxonomy]);

  const typeOptionsList = useMemo(() => {
    if (!mainKey || !subKey) return [];
    return getTypesForSelection(mainKey, subKey, taxonomy);
  }, [mainKey, subKey, taxonomy]);

  const mainOptions = useMemo(() => {
    const q = mainQuery.trim().toLowerCase();
    if (!q) return mainOptionsList;
    return mainOptionsList.filter((x) => x.toLowerCase().includes(q));
  }, [mainQuery, mainOptionsList]);

  const subOptions = useMemo(() => {
    const q = subQuery.trim().toLowerCase();
    if (!q) return subOptionsList;
    return subOptionsList.filter((x) => x.toLowerCase().includes(q));
  }, [subQuery, subOptionsList]);

  const typeOptions = useMemo(() => {
    const q = typeQuery.trim().toLowerCase();
    if (!q) return typeOptionsList;
    return typeOptionsList.filter((x) => x.toLowerCase().includes(q));
  }, [typeQuery, typeOptionsList]);

  const mainInList = mainOptionsList.includes(selectedMain);
  const subInList = subOptionsList.includes(selectedSub);
  const needsOtherMainText = isOtherCategoryLabel(selectedMain);
  const needsOtherSubText = isOtherCategoryLabel(selectedSub);
  const selectedType = String(productData.premiumType || '').trim();
  const typeInList = typeOptionsList.includes(selectedType);
  const needsOtherTypeText = isOtherCategoryLabel(selectedType);

  const displayMain =
    needsOtherMainText ? CATEGORY_OTHER_LABEL : selectedMain;
  const displaySub =
    needsOtherSubText ? CATEGORY_OTHER_LABEL : selectedSub;
  const displayType =
    needsOtherTypeText ? CATEGORY_OTHER_LABEL : selectedType;

  // Keep dropdowns closed if user clicks outside.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryWrapRef.current && !categoryWrapRef.current.contains(e.target)) {
        setMainOpen(false);
        setSubOpen(false);
        setTypeOpen(false);
      }
      if (purchaseTypeRef.current && !purchaseTypeRef.current.contains(e.target)) {
        setPurchaseTypeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!needsOtherMainText && otherMainText) setOtherMainText('');
  }, [needsOtherMainText, otherMainText]);

  useEffect(() => {
    if (!needsOtherSubText && otherSubText) setOtherSubText('');
  }, [needsOtherSubText, otherSubText]);

  useEffect(() => {
    if (!needsOtherTypeText && otherTypeText) setOtherTypeText('');
  }, [needsOtherTypeText, otherTypeText]);

  useEffect(() => {
    if (!selectedMain || mainInList || needsOtherMainText) return;
    if (otherMainText === '') setOtherMainText(selectedMain);
  }, [selectedMain, mainInList, needsOtherMainText, otherMainText]);

  useEffect(() => {
    if (!selectedMain || !selectedSub || subInList || needsOtherSubText) return;
    if (otherSubText === '') setOtherSubText(selectedSub);
  }, [selectedMain, selectedSub, subInList, needsOtherSubText, otherSubText]);

  useEffect(() => {
    if (!selectedType || typeInList || needsOtherTypeText) return;
    if (otherTypeText === '') setOtherTypeText(selectedType);
  }, [selectedType, typeInList, needsOtherTypeText, otherTypeText]);

  const guardCategoryPath = (main, sub, type) => {
    if (isPremium) return true;
    if (!lockedCategoryPath) return true;

    const mainClean = String(main || '').trim();
    const subClean = String(sub || '').trim();
    const typeVal =
      type !== undefined && type !== null
        ? String(type || '').trim()
        : String(productData.premiumType || '').trim();
    const categoryStr = subClean ? `${mainClean} / ${subClean}` : mainClean;
    const next = normalizeCategoryPath(categoryStr, typeVal);

    if (mainClean && mainClean.toLowerCase() !== lockedCategoryPath.main) {
      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
      return false;
    }
    if (subClean && subClean.toLowerCase() !== lockedCategoryPath.sub) {
      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
      return false;
    }
    if (typeVal && typeVal.toLowerCase() !== lockedCategoryPath.type) {
      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
      return false;
    }

    if (!isCompleteCategoryPath(next)) return true;
    if (!categoryPathsEqual(next, lockedCategoryPath)) {
      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
      return false;
    }
    return true;
  };

  const applyCategoryFields = (mainLabel, subLabel, nextOtherMain, nextOtherSub) => {
    const om = nextOtherMain ?? otherMainText;
    const os = nextOtherSub ?? otherSubText;
    let main = resolveCategorySegment(mainLabel, om);
    let sub = resolveCategorySegment(subLabel, os);
    if (!main && isOtherCategoryLabel(mainLabel)) main = CATEGORY_OTHER_LABEL;
    if (!sub && isOtherCategoryLabel(subLabel)) sub = CATEGORY_OTHER_LABEL;
    const value = main && sub ? `${main} / ${sub}` : main || '';
    setProductData((prev) => ({ ...prev, category: value, premiumType: '' }));
    setOtherTypeText('');
  };

  const setPremiumCategoryGuarded = (mainLabel, subLabel, opts = {}) => {
    const resolvedMain = resolveCategorySegment(mainLabel, opts.otherMain ?? otherMainText);
    const resolvedSub = resolveCategorySegment(subLabel, opts.otherSub ?? otherSubText);
    if (!guardCategoryPath(resolvedMain, resolvedSub, '')) return;
    applyCategoryFields(mainLabel, subLabel, opts.otherMain, opts.otherSub);
  };

  const setPremiumTypeGuarded = (typeLabel, opts = {}) => {
    const { main, sub } = splitPremiumCategoryString(productData.category);
    const ot = opts.otherType ?? otherTypeText;
    let val = resolveTypeValue(typeLabel, ot);
    if (!val && isOtherCategoryLabel(typeLabel)) val = CATEGORY_OTHER_LABEL;
    if (!guardCategoryPath(main, sub, val || typeLabel)) return;
    setProductData((prev) => ({ ...prev, premiumType: val }));
  };

  useEffect(() => {
    if (isPremium || !lockedCategoryPath) return;
    const current = pathFromProductData(productData);
    if (isCompleteCategoryPath(current)) return;
    const main = lockedCategoryPath.mainDisplay || categoryLimits?.lockedCategoryPath?.main;
    const sub = lockedCategoryPath.subDisplay || categoryLimits?.lockedCategoryPath?.sub;
    const type = lockedCategoryPath.typeDisplay || categoryLimits?.lockedCategoryPath?.type;
    if (!main || !sub || !type) return;
    setProductData((prev) => ({
      ...prev,
      category: `${main} / ${sub}`,
      premiumType: type,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedCategoryPath, isPremium]);

  const saveSingleStoreAddress = async () => {
    if (!isFreeSeller) {
      navigate('/seller/kyc');
      return;
    }
    const addr = storeAddressDraft.trim();
    if (!addr) {
      setStoreAddressError('Please enter a store address.');
      return;
    }
    setStoreAddressError('');
    setStoreAddressSaving(true);
    try {
      const formData = new FormData();
      formData.append('storeAddresses', addr);
      await api.patch('/seller/kyc/step1', formData);
      setStoreAddressDraft('');

      // Refresh inventory options so the checkbox list appears immediately.
      const { data } = await api.get('/seller/products/inventory-options');
      // NOTE: This component doesn't own inventoryOptions state; we do a soft refresh
      // by updating the selection to include the newly added address if any.
      const nextAddrs = data?.storeAddresses || [];
      if (nextAddrs.length > 0) {
        setProductData((prev) => ({
          ...prev,
          shipFromStoreAddresses: [nextAddrs[0]],
        }));
      }
      // Force a re-render hint by navigating nowhere; parent keeps current page.
      // (The checkbox list will still be driven by parent inventoryOptions, but this
      // makes the newly selected address ready once parent refreshes.)
    } catch (err) {
      setStoreAddressError(
        err?.response?.data?.message || 'Failed to save store address. Please try again.'
      );
    } finally {
      setStoreAddressSaving(false);
    }
  };

  return (
    <div className="space-y-8 pt-6 border-t border-[#E1E3E5]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">Price</label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#6D7175]">₹</span>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
              placeholder="00.00"
              value={productData.price}
              onChange={(e) => setProductData({ ...productData, price: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Discounted Price
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[#6D7175]">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
              placeholder="00.00"
              value={productData.compareAtPrice}
              onChange={(e) =>
                setProductData({ ...productData, compareAtPrice: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            SKU (Stock Keeping Unit)
          </label>
          <input
            type="text"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            placeholder="e.g. PROD-SKU-001"
            value={productData.sku}
            onChange={(e) => setProductData({ ...productData, sku: e.target.value })}
          />
          <div className="flex items-center gap-2 mt-3">
            <input
              type="checkbox"
              id="continueSellingPricing"
              className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]"
              checked={productData.continueSellingWhenOutOfStock}
              onChange={(e) =>
                setProductData({
                  ...productData,
                  continueSellingWhenOutOfStock: e.target.checked,
                })
              }
            />
            <label htmlFor="continueSellingPricing" className="text-[14px] text-[#202223]">
              Continue selling when out of stock
            </label>
          </div>
        </div>
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Dispatch &amp; Delivery time
          </label>
          <div className="flex flex-wrap items-center gap-2 border border-[#8C9196] rounded-md px-3 py-2 bg-white">
            <span className="text-[14px] text-[#202223] whitespace-nowrap">
              Item will be delivered in
            </span>
            <input
              type="number"
              min="0"
              step="1"
              className="w-16 border border-[#8C9196] rounded-md px-2 py-1 text-center text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
              value={productData.dispatchDeliveryDays ?? ''}
              onChange={(e) =>
                setProductData({ ...productData, dispatchDeliveryDays: e.target.value })
              }
            />
            <span className="text-[14px] text-[#202223]">Days</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Minimum order Quantity
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            placeholder="1"
            value={productData.minOrderQuantity ?? ''}
            onChange={(e) =>
              setProductData({ ...productData, minOrderQuantity: e.target.value })
            }
          />
          <FieldError show={minInvalid || minGreaterThanMax}>
            Oops Minimum 1 required
          </FieldError>
        </div>
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Maximum order Quantity
          </label>
          <input
            type="number"
            min="1"
            step="1"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            placeholder={String(maxOrderLimit)}
            value={productData.maxOrderQuantity ?? ''}
            onChange={(e) =>
              setProductData({ ...productData, maxOrderQuantity: e.target.value })
            }
          />
          <FieldError show={maxInvalid}>
            Oops Maximum {maxOrderLimit} allowed
          </FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Purchase Type
          </label>
          <div className="relative" ref={purchaseTypeRef}>
            <button
              type="button"
              disabled={addressesLocked}
              className={`w-full flex items-center justify-between border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] ${
                addressesLocked ? 'opacity-70 cursor-not-allowed bg-[#F6F6F7]' : 'hover:bg-[#F6F6F7]'
              }`}
              onClick={() => setPurchaseTypeOpen((v) => !v)}
            >
              <span className="flex items-center">
                {(() => {
                  const currentPurchaseType = productData.purchaseType || 'one_time';
                  const selectedOpt = purchaseOptions.find((o) => o.value === currentPurchaseType) || purchaseOptions[0];
                  const isSelectedOptPremium = selectedOpt.value === 'subscription' || selectedOpt.value === 'custom_order';
                  return (
                    <>
                      {selectedOpt.label}
                      {isSelectedOptPremium && (
                        <PremiumCrownIcon size={16} className="inline-block ml-2 align-middle" />
                      )}
                    </>
                  );
                })()}
              </span>
              <ChevronDown size={18} className="text-[#6D7175]" />
            </button>

            {purchaseTypeOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-[#E1E3E5] rounded-md shadow-lg overflow-hidden">
                <ul className="py-1">
                  {purchaseOptions.map((opt) => {
                    const isOptPremium = opt.value === 'subscription' || opt.value === 'custom_order';
                    const isSelectable = opt.available !== false;
                    const isSelected = opt.value === (productData.purchaseType || 'one_time');
                    return (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2 text-[14px] flex items-center transition-colors ${
                            isSelected
                              ? 'bg-[#F2F7FE] text-[#005bd3] font-medium'
                              : 'text-[#202223] hover:bg-[#F6F6F7]'
                          } ${!isSelectable ? 'opacity-70' : ''}`}
                          onClick={() => {
                            if (!isSelectable) {
                              onRequestUpgrade?.('premium', { autoRedirect: true });
                            } else {
                              setProductData({ ...productData, purchaseType: opt.value });
                            }
                            setPurchaseTypeOpen(false);
                          }}
                        >
                          {isSelected && (
                            <span className="text-[#202223] mr-2 font-semibold">✓</span>
                          )}
                          <span className={isSelected ? 'font-semibold text-[#202223]' : 'text-[#202223]'}>
                            {opt.label}
                          </span>
                          {isOptPremium && (
                            <PremiumCrownIcon size={16} className="inline-block ml-2 align-middle" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Purchase type helper bullets removed as requested */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div>
          <label className="block text-[16px] font-semibold text-[#202223] mb-2">
            Store Address
          </label>
          {hasStoreAddresses ? (
            <div className="border border-[#8C9196] rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
              {inventoryOptions.storeAddresses.map((addr) => (
                <label
                  key={addr}
                  className="flex items-start gap-2 text-[14px] text-[#202223] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]"
                    checked={(productData.shipFromStoreAddresses || []).includes(addr)}
                    onChange={() => onToggleStoreAddress(addr)}
                    disabled={addressesLocked}
                  />
                  <span>{addr}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {isFreeSeller ? (
                <>
                  <p className="text-[12px] text-[#6D7175]">
                    Add your store address (free sellers can add only 1).
                  </p>
                  <textarea
                    rows={3}
                    value={storeAddressDraft}
                    onChange={(e) => setStoreAddressDraft(e.target.value)}
                    className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white resize-y"
                    placeholder="Enter your store address"
                    disabled={storeAddressSaving}
                  />
                  {storeAddressError && (
                    <p className="text-[12px] text-[#D82C0D] flex items-center gap-1.5">
                      <XCircle size={14} /> {storeAddressError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={saveSingleStoreAddress}
                    disabled={storeAddressSaving}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#005bd3] hover:bg-[#0049a6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors text-[14px]"
                  >
                    {storeAddressSaving ? 'Saving...' : 'Save store address'}
                  </button>
                </>
              ) : (
                <div className="text-[13px] text-[#B98900] bg-[#FFF5E6] border border-[#FFEA8A] rounded-md px-3 py-2">
                  No store addresses on your profile. Add them in KYC (Organization details) first.
                  <button
                    type="button"
                    onClick={() => navigate('/seller/kyc')}
                    className="mt-3 w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 rounded-md bg-[#005bd3] hover:bg-[#0049a6] text-white font-medium transition-colors text-[14px]"
                  >
                    Go to KYC
                  </button>
                </div>
              )}
            </div>
          )}
          <p className="text-[12px] text-[#6D7175] mt-2">
            Select one or multiple store addresses to ship product from.
          </p>
        </div>
      </div>

      {/* Bulk Purchase / B2B — visible to all; premium can edit */}
      <div
        className={`border border-[#E1E3E5] rounded-lg overflow-hidden ${!isPremium ? 'cursor-pointer' : ''}`}
        onClick={() => {
          if (!isPremium) {
            promptUpgrade('bulk_purchase');
          }
        }}
      >
        <div className={`px-4 py-3 bg-[#F6F6F7] flex items-center justify-between ${!isPremium ? 'pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2 text-[#202223] font-semibold">
            <span>Bulk Purchase/B2B</span>
            <Crown size={18} className="text-[#B98900]" />
            {!isPremium && (
              <span className="text-[11px] font-medium text-[#B98900] bg-[#FFF4E5] px-2 py-0.5 rounded-full">
                Premium
              </span>
            )}
          </div>

          <label
            className="flex items-center gap-3 text-[13px] text-[#202223]"
          >
            <span className="font-medium">Available</span>
            <input
              type="checkbox"
              className="w-10 h-5 accent-[#008060]"
              checked={isPremium && productData.bulkPurchaseEnabled === true}
              readOnly={!isPremium}
              onChange={(e) => {
                if (promptUpgrade('bulk_purchase')) return;
                const enabled = e.target.checked;
                setProductData((prev) => ({
                  ...prev,
                  bulkPurchaseEnabled: enabled,
                  bulkPurchaseMinOrderQuantity: enabled
                    ? prev.bulkPurchaseMinOrderQuantity ?? 50
                    : prev.bulkPurchaseMinOrderQuantity ?? 1,
                }));
              }}
            />
          </label>
        </div>

        <div className={`px-4 py-4 bg-white ${!isPremium ? 'pointer-events-none' : ''}`}>
          <label className="block text-[14px] font-semibold text-[#202223] mb-2">
            Minimum Order Quantity (Pieces/Units)
          </label>

          <div className="flex items-stretch gap-3">
            <input
              type="number"
              min="1"
              step="1"
              readOnly={!isPremium}
              className={`flex-1 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] ${
                isPremium && productData.bulkPurchaseEnabled
                  ? 'bg-white'
                  : 'bg-[#F6F6F7] opacity-60'
              }`}
              value={
                isPremium
                  ? productData.bulkPurchaseMinOrderQuantity ?? 50
                  : productData.bulkPurchaseMinOrderQuantity ?? 50
              }
              disabled={!isPremium || !productData.bulkPurchaseEnabled}
              onChange={(e) => {
                if (promptUpgrade('bulk_purchase')) return;
                setProductData((prev) => ({
                  ...prev,
                  bulkPurchaseMinOrderQuantity: e.target.value,
                }));
              }}
            />

            <div className="flex flex-col">
               <button
                 type="button"
                 disabled={!isPremium || !productData.bulkPurchaseEnabled}
                 className="h-1/2 px-3 border border-[#8C9196] rounded-t-md bg-white text-[#202223] hover:bg-[#F6F6F7] disabled:opacity-50"
                 onClick={(e) => {
                   e.stopPropagation();
                   if (promptUpgrade('bulk_purchase')) return;
                   const cur = Number(productData.bulkPurchaseMinOrderQuantity ?? 50);
                   const next = Number.isFinite(cur) ? cur + 1 : 50;
                   setProductData((prev) => ({
                     ...prev,
                     bulkPurchaseMinOrderQuantity: next,
                   }));
                 }}
                 aria-label="Increase minimum order quantity"
               >
                 ▲
               </button>
               <button
                 type="button"
                 disabled={!isPremium || !productData.bulkPurchaseEnabled}
                 className="h-1/2 px-3 border border-t-0 border-[#8C9196] rounded-b-md bg-white text-[#202223] hover:bg-[#F6F6F7] disabled:opacity-50"
                 onClick={(e) => {
                   e.stopPropagation();
                   if (promptUpgrade('bulk_purchase')) return;
                   const cur = Number(productData.bulkPurchaseMinOrderQuantity ?? 50);
                   const next = Number.isFinite(cur) ? Math.max(1, cur - 1) : 50;
                   setProductData((prev) => ({
                     ...prev,
                     bulkPurchaseMinOrderQuantity: next,
                   }));
                 }}
                 aria-label="Decrease minimum order quantity"
               >
                 ▼
               </button>
            </div>
          </div>

          <p className="text-[12px] text-[#6D7175] mt-2">
            Bulk purchase is visible to customers as a B2B option.
            {!isPremium && ' Upgrade to Premium to enable this for your products.'}
          </p>
        </div>
      </div>

      {/* Category — full hierarchy for all sellers; free plan locked to one path */}
      <div ref={categoryWrapRef} className="border border-[#E1E3E5] rounded-lg">
        <div className="px-4 py-3 bg-[#F6F6F7] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#202223] font-semibold">
            <span>Category</span>
            <Crown size={18} className="text-[#B98900]" />
          </div>
        </div>

        <div className="px-4 py-4 bg-white">
          {!isPremium && (
            <p className="text-[12px] text-[#6D7175] mb-4">
              {categoryLimits?.categoryHint}
              {lockedPathLabel ? (
                <>
                  {' '}
                  Your store category path:{' '}
                  <span className="font-semibold text-[#202223]">{lockedPathLabel}</span>
                  . All products must use this same path.
                </>
              ) : (
                ' Select one Main → Sub → Type path for your first product; after that, all products must stay on that path.'
              )}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Main category */}
            <div className="relative">
              <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                Main Category
              </label>
              <button
                type="button"
                className="w-full flex items-center justify-between border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white hover:bg-[#F6F6F7]"
                onClick={() => {
                  if (!isPremium && lockedCategoryPath) {
                    onRequestUpgrade?.('free_category_path', { autoRedirect: true });
                    return;
                  }
                  setMainOpen((v) => !v);
                  setSubOpen(false);
                  setTypeOpen(false);
                  setMainQuery('');
                }}
              >
                <span className={displayMain || selectedMain ? '' : 'text-[#6D7175]'}>
                  {displayMain || selectedMain || 'Select main category'}
                </span>
                <ChevronDown size={18} className="text-[#6D7175]" />
              </button>
              {mainOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#E1E3E5] rounded-md shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-[#E1E3E5]">
                    <div className="flex items-center gap-2 border border-[#E1E3E5] rounded-md px-2 py-1.5 bg-white">
                      <Search size={16} className="text-[#6D7175]" />
                      <input
                        type="text"
                        value={mainQuery}
                        onChange={(e) => setMainQuery(e.target.value)}
                        placeholder="Search main category..."
                        className="w-full outline-none text-[13px] text-[#202223]"
                        autoFocus
                      />
                    </div>
                  </div>
                  <ul className="max-h-64 overflow-y-auto">
                    {mainOptions.length === 0 && (
                      <li className="px-3 py-2 text-[13px] text-[#6D7175]">No matches</li>
                    )}
                    {mainOptions.map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-[14px] text-[#202223] hover:bg-[#F6F6F7]"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (!guardCategoryPath(name, '', '')) return;
                            setOtherMainText('');
                            setOtherSubText('');
                            setPremiumCategoryGuarded(name, '');
                            setMainOpen(false);
                            setSubOpen(false);
                            setTypeOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

              {/* Sub category */}
              <div className="relative">
                <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                  Sub-Category
                </label>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] ${
                    mainKey ? 'bg-white hover:bg-[#F6F6F7]' : 'bg-[#F6F6F7] opacity-70 cursor-not-allowed'
                  }`}
                  disabled={!mainKey}
                  onClick={() => {
                    if (!isPremium && lockedCategoryPath) {
                      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
                      return;
                    }
                    if (!mainKey) return;
                    setSubOpen((v) => !v);
                    setMainOpen(false);
                    setTypeOpen(false);
                    setSubQuery('');
                  }}
                >
                  <span className={displaySub || selectedSub ? '' : 'text-[#6D7175]'}>
                    {displaySub || selectedSub || 'Select sub-category'}
                  </span>
                  <ChevronDown size={18} className="text-[#6D7175]" />
                </button>

                {subOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E1E3E5] rounded-md shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-[#E1E3E5]">
                      <div className="flex items-center gap-2 border border-[#E1E3E5] rounded-md px-2 py-1.5 bg-white">
                        <Search size={16} className="text-[#6D7175]" />
                        <input
                          type="text"
                          value={subQuery}
                          onChange={(e) => setSubQuery(e.target.value)}
                          placeholder="Search sub-category..."
                          className="w-full outline-none text-[13px] text-[#202223]"
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-64 overflow-y-auto">
                      {subOptions.length === 0 && (
                        <li className="px-3 py-2 text-[13px] text-[#6D7175]">
                          No matches
                        </li>
                      )}
                      {subOptions.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-[14px] text-[#202223] hover:bg-[#F6F6F7]"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (!guardCategoryPath(selectedMain, name, productData.premiumType)) return;
                              setPremiumCategoryGuarded(selectedMain, name);
                              setSubOpen(false);
                              setTypeOpen(false);
                            }}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="relative">
                <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                  Type
                </label>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] ${
                    mainKey && subKey
                      ? 'bg-white hover:bg-[#F6F6F7]'
                      : 'bg-[#F6F6F7] opacity-70 cursor-not-allowed'
                  }`}
                  disabled={!mainKey || !subKey}
                  onClick={() => {
                    if (!isPremium && lockedCategoryPath) {
                      onRequestUpgrade?.('free_category_path', { autoRedirect: true });
                      return;
                    }
                    if (!mainKey || !subKey) return;
                    setTypeOpen((v) => !v);
                    setMainOpen(false);
                    setSubOpen(false);
                    setTypeQuery('');
                  }}
                >
                  <span className={displayType || selectedType ? '' : 'text-[#6D7175]'}>
                    {displayType || selectedType || 'Select type'}
                  </span>
                  <ChevronDown size={18} className="text-[#6D7175]" />
                </button>

                {typeOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E1E3E5] rounded-md shadow-lg overflow-hidden">
                    <div className="p-2 border-b border-[#E1E3E5]">
                      <div className="flex items-center gap-2 border border-[#E1E3E5] rounded-md px-2 py-1.5 bg-white">
                        <Search size={16} className="text-[#6D7175]" />
                        <input
                          type="text"
                          value={typeQuery}
                          onChange={(e) => setTypeQuery(e.target.value)}
                          placeholder="Search type..."
                          className="w-full outline-none text-[13px] text-[#202223]"
                          autoFocus
                        />
                      </div>
                    </div>
                    <ul className="max-h-64 overflow-y-auto">
                      {typeOptions.length === 0 && (
                        <li className="px-3 py-2 text-[13px] text-[#6D7175]">
                          No matches
                        </li>
                      )}
                      {typeOptions.map((name) => (
                        <li key={name}>
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-[14px] text-[#202223] hover:bg-[#F6F6F7]"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setPremiumTypeGuarded(name);
                              setTypeOpen(false);
                              if (!isOtherCategoryLabel(name)) setOtherTypeText('');
                            }}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {needsOtherMainText && (
              <div className="mt-4">
                <label className="block text-[13px] text-[#202223] mb-1 font-medium">
                  Please mention main category
                </label>
                <input
                  type="text"
                  value={otherMainText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherMainText(val);
                    setPremiumCategoryGuarded(CATEGORY_OTHER_LABEL, selectedSub, {
                      otherMain: val,
                    });
                  }}
                  placeholder="Type your main category"
                  className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
                />
              </div>
            )}

            {needsOtherSubText && (
              <div className="mt-4">
                <label className="block text-[13px] text-[#202223] mb-1 font-medium">
                  Please mention sub-category
                </label>
                <input
                  type="text"
                  value={otherSubText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherSubText(val);
                    setPremiumCategoryGuarded(selectedMain, CATEGORY_OTHER_LABEL, {
                      otherSub: val,
                    });
                  }}
                  placeholder="Type your sub-category"
                  className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
                />
              </div>
            )}

            {needsOtherTypeText && (
              <div className="mt-4">
                <label className="block text-[13px] text-[#202223] mb-1 font-medium">
                  Please mention type
                </label>
                <input
                  type="text"
                  value={otherTypeText}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOtherTypeText(val);
                    setPremiumTypeGuarded(CATEGORY_OTHER_LABEL, { otherType: val });
                  }}
                  placeholder="Type your product type"
                  className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
                />
              </div>
            )}

            <p className="text-[12px] text-[#6D7175] mt-3">
              Selected category will be saved as <span className="font-medium">{productData.category || '—'}</span>
            </p>
            <p className="text-[12px] text-[#6D7175] mt-1">
              Selected type will be saved as <span className="font-medium">{productData.premiumType || '—'}</span>
            </p>
          </div>
        </div>

      <ProductVariantsFields productData={productData} setProductData={setProductData} />
      <ProductShippingFields productData={productData} setProductData={setProductData} />
    </div>
  );
}
