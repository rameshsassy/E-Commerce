import React from 'react';

export default function ProductPremiumCategoryKeywordsFields({
  productData,
  setProductData,
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[14px] font-semibold text-[#202223] mb-2">
          Keywords (comma separated)
        </label>
        <input
          type="text"
          value={productData.keywords || ''}
          onChange={(e) =>
            setProductData({ ...productData, keywords: e.target.value })
          }
          placeholder="e.g. organic, handmade, gifts"
          className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
        />
        <p className="text-[12px] text-[#6D7175] mt-2">
          These help search; separated by commas.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-semibold text-[#202223] mb-2">
            Unit Price (optional)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={productData.unitPrice ?? ''}
            onChange={(e) =>
              setProductData({
                ...productData,
                unitPrice: e.target.value,
              })
            }
            placeholder="00.00"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
          />
        </div>

        <div className="flex items-center gap-3 mt-8 sm:mt-[26px]">
          <input
            type="checkbox"
            checked={Boolean(productData.chargeTax)}
            onChange={(e) =>
              setProductData({
                ...productData,
                chargeTax: e.target.checked,
              })
            }
            className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]"
          />
          <label className="text-[14px] text-[#202223] font-medium">
            Charge tax for this product
          </label>
        </div>
      </div>
    </div>
  );
}

