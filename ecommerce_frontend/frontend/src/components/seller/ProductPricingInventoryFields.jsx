import { XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../../utils/api';
import ProductVariantsFields from './ProductVariantsFields';
import ProductShippingFields from './ProductShippingFields';
import { Crown } from 'lucide-react';

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
}) {
  const navigate = useNavigate();
  const [storeAddressDraft, setStoreAddressDraft] = useState('');
  const [storeAddressSaving, setStoreAddressSaving] = useState(false);
  const [storeAddressError, setStoreAddressError] = useState('');
  const maxOrderLimit = inventoryOptions?.maxOrderQuantityLimit ?? 5;
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
  const isFreeSeller = inventoryOptions?.isSubscribedSeller === false;

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
          <select
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
            value={productData.purchaseType || 'one_time'}
            onChange={(e) =>
              setProductData({ ...productData, purchaseType: e.target.value })
            }
            disabled={addressesLocked}
          >
            {purchaseOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.available === false}>
                {opt.label}
              </option>
            ))}
          </select>
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

      {/* Premium-only: Bulk Purchase / B2B */}
      {inventoryOptions?.isSubscribedSeller && (
        <div className="border border-[#E1E3E5] rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-[#F6F6F7] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#202223] font-semibold">
              <span>Bulk Purchase/B2B</span>
              <Crown size={18} className="text-[#B98900]" />
            </div>

            <label className="flex items-center gap-3 text-[13px] text-[#202223]">
              <span className="font-medium">Available</span>
              <input
                type="checkbox"
                className="w-10 h-5 accent-[#008060]"
                checked={productData.bulkPurchaseEnabled === true}
                onChange={(e) => {
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

          <div className="px-4 py-4 bg-white">
            <label className="block text-[14px] font-semibold text-[#202223] mb-2">
              Minimum Order Quantity (Pieces/Units)
            </label>

            <div className="flex items-stretch gap-3">
              <input
                type="number"
                min="1"
                step="1"
                className={`flex-1 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] ${
                  productData.bulkPurchaseEnabled ? 'bg-white' : 'bg-[#F6F6F7] opacity-60'
                }`}
                value={productData.bulkPurchaseMinOrderQuantity ?? 50}
                disabled={!productData.bulkPurchaseEnabled}
                onChange={(e) =>
                  setProductData((prev) => ({
                    ...prev,
                    bulkPurchaseMinOrderQuantity: e.target.value,
                  }))
                }
              />

              <div className="flex flex-col">
                <button
                  type="button"
                  disabled={!productData.bulkPurchaseEnabled}
                  className="h-1/2 px-3 border border-[#8C9196] rounded-t-md bg-white hover:bg-[#F6F6F7] disabled:opacity-50"
                  onClick={() => {
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
                  disabled={!productData.bulkPurchaseEnabled}
                  className="h-1/2 px-3 border border-t-0 border-[#8C9196] rounded-b-md bg-white hover:bg-[#F6F6F7] disabled:opacity-50"
                  onClick={() => {
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
            </p>
          </div>
        </div>
      )}

      <ProductVariantsFields productData={productData} setProductData={setProductData} />
      <ProductShippingFields productData={productData} setProductData={setProductData} />
    </div>
  );
}
