import DeliveryByFields from './DeliveryByFields';

export default function ProductShippingFields({ productData, setProductData }) {
  return (
    <div className="mt-8 border-t border-[#E1E3E5] pt-6">
      <div className="p-0">
        <h3 className="font-semibold text-[15px] text-[#202223] mb-4">Shipping</h3>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPhysical"
            className="w-4 h-4 rounded border-[#8C9196] text-[#005bd3] focus:ring-[#005bd3]"
            checked={productData.isPhysicalProduct}
            onChange={(e) =>
              setProductData({ ...productData, isPhysicalProduct: e.target.checked })
            }
          />
          <label htmlFor="isPhysical" className="text-[14px] font-medium text-[#202223]">
            This is a physical product
          </label>
        </div>
      </div>

      {productData.isPhysicalProduct && (
        <div className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[13px] text-[#202223] mb-1">
                Package weight along with product
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="flex-1 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                  value={productData.productWeight}
                  onChange={(e) =>
                    setProductData({ ...productData, productWeight: e.target.value })
                  }
                />
                <select
                  className="w-20 border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white"
                  value={productData.productWeightUnit}
                  onChange={(e) =>
                    setProductData({ ...productData, productWeightUnit: e.target.value })
                  }
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[13px] text-[#202223] mb-1">
                Package dimensions
              </label>
              {productData.packageType === 'custom' ? (
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]"
                    placeholder="Length"
                    value={productData.packageLength}
                    onChange={(e) =>
                      setProductData({ ...productData, packageLength: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]"
                    placeholder="Width"
                    value={productData.packageWidth}
                    onChange={(e) =>
                      setProductData({ ...productData, packageWidth: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="border border-[#8C9196] rounded-md px-2 py-2 text-[14px] text-[#202223]"
                    placeholder="Height"
                    value={productData.packageHeight}
                    onChange={(e) =>
                      setProductData({ ...productData, packageHeight: e.target.value })
                    }
                  />
                </div>
              ) : (
                <input
                  type="text"
                  readOnly
                  className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#6D7175] bg-[#F6F6F7]"
                  placeholder="Length × Width × Height"
                  value="22 × 13.7 × 4.2 cm (store default)"
                />
              )}
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label className="block text-[13px] text-[#202223] mb-1">Package size</label>
              <select
                className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3] bg-white mb-3"
                value={productData.packageType}
                onChange={(e) => setProductData({ ...productData, packageType: e.target.value })}
              >
                <option value="Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg">
                  Store default • Sample box - 22 × 13.7 × 4.2 cm
                </option>
                <option value="custom">Custom dimensions</option>
              </select>
              {productData.packageType === 'custom' && (
                <select
                  className="w-24 border border-[#8C9196] rounded-md px-2 py-1 text-[13px] text-[#202223] bg-white"
                  value={productData.packageDimensionsUnit}
                  onChange={(e) =>
                    setProductData({ ...productData, packageDimensionsUnit: e.target.value })
                  }
                >
                  <option value="cm">cm</option>
                  <option value="in">in</option>
                </select>
              )}
            </div>

            <DeliveryByFields productData={productData} setProductData={setProductData} />
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-[#E1E3E5] space-y-4">
        <div>
          <h3 className="font-semibold text-[15px] text-[#202223] mb-1">Search engine listing</h3>
          <p className="text-[13px] text-[#6D7175]">
            Add a title and description to see how this product might appear in a search engine
            listing
          </p>
        </div>
        <div>
          <label className="block text-[13px] text-[#202223] mb-1">Page title</label>
          <input
            type="text"
            maxLength={70}
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            value={productData.pageTitle}
            onChange={(e) => setProductData({ ...productData, pageTitle: e.target.value })}
          />
          <p className="text-[12px] text-[#6D7175] mt-1">
            {productData.pageTitle?.length || 0} of 70 characters used
          </p>
        </div>
        <div>
          <label className="block text-[13px] text-[#202223] mb-1">Meta description</label>
          <textarea
            maxLength={160}
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] min-h-[80px] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            value={productData.metaDescription}
            onChange={(e) =>
              setProductData({ ...productData, metaDescription: e.target.value })
            }
          />
          <p className="text-[12px] text-[#6D7175] mt-1">
            {productData.metaDescription?.length || 0} of 160 characters used
          </p>
        </div>
        <div>
          <label className="block text-[13px] text-[#202223] mb-1">URL handle</label>
          <input
            type="text"
            className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
            value={productData.urlHandle}
            onChange={(e) => setProductData({ ...productData, urlHandle: e.target.value })}
          />
          <p className="text-[12px] text-[#6D7175] mt-1">
            https://aashansh.org/products/{productData.urlHandle}
          </p>
        </div>
      </div>
    </div>
  );
}

