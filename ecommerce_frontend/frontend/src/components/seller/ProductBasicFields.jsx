import { XCircle } from 'lucide-react';
import ProductRichTextEditor from './ProductRichTextEditor';
import ProductImageUploader from './ProductImageUploader';
import ProductPolicyCareFields from './ProductPolicyCareFields';
import ProductPricingInventoryFields from './ProductPricingInventoryFields';
import {
  PRODUCT_TITLE_MAX,
  PRODUCT_DESCRIPTION_MAX,
  getProductTitleValidation,
  getProductDescriptionValidation,
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

export default function ProductBasicFields({
  productData,
  setProductData,
  productImages,
  setProductImages,
  inventoryOptions,
  editingProduct,
  onToggleStoreAddress,
}) {
  const titleValidation = getProductTitleValidation(productData.title);
  const descValidation = getProductDescriptionValidation(productData.description);

  const handleTitleChange = (val) => {
    if (hasExternalLinks(val)) {
      alertNoLinks();
      return;
    }
    const autoHandle = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    setProductData({
      ...productData,
      title: val.slice(0, PRODUCT_TITLE_MAX + 50),
      pageTitle:
        productData.pageTitle === '' ||
        productData.pageTitle === productData.title.substring(0, 70)
          ? val.substring(0, 70)
          : productData.pageTitle,
      urlHandle:
        productData.urlHandle === '' ||
        productData.urlHandle ===
          productData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
          ? autoHandle
          : productData.urlHandle,
    });
  };

  const handleTitlePaste = (e) => {
    const pasted = e.clipboardData?.getData('text') || '';
    if (hasExternalLinks(pasted)) {
      e.preventDefault();
      alertNoLinks();
    }
  };

  const handleDescriptionChange = (val) => {
    const temp = document.createElement('div');
    temp.innerHTML = val;
    const plainDesc = (temp.textContent || temp.innerText || '').substring(0, 160);
    setProductData((prev) => {
      const prevPlain = (() => {
        const t = document.createElement('div');
        t.innerHTML = prev.description;
        return (t.textContent || t.innerText || '').substring(0, 160);
      })();
      return {
        ...prev,
        description: val,
        metaDescription:
          prev.metaDescription === '' || prev.metaDescription === prevPlain
            ? plainDesc
            : prev.metaDescription,
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-[14px] font-medium text-[#202223] mb-1">Product title</label>
        <input
          required
          type="text"
          className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] bg-white outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
          placeholder="Short sleeve t-shirt"
          value={productData.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onPaste={handleTitlePaste}
          maxLength={PRODUCT_TITLE_MAX + 50}
        />
        <p className="text-[12px] text-[#6D7175] mt-1">
          {Math.min(titleValidation.len, PRODUCT_TITLE_MAX)}/{PRODUCT_TITLE_MAX} characters used
        </p>
        <ValidationHints validation={titleValidation} maxLen={PRODUCT_TITLE_MAX} />
      </div>

      <div>
        <label className="block text-[14px] font-medium text-[#202223] mb-1">Product Description</label>
        <ProductRichTextEditor
          key="product-description-editor"
          value={productData.description}
          onChange={handleDescriptionChange}
        />
        <p className="text-[12px] text-[#6D7175] mt-1">
          {Math.min(descValidation.len, PRODUCT_DESCRIPTION_MAX)}/{PRODUCT_DESCRIPTION_MAX}{' '}
          characters used
        </p>
        <ValidationHints validation={descValidation} maxLen={PRODUCT_DESCRIPTION_MAX} />
      </div>

      <div>
        <ProductImageUploader images={productImages} onChange={setProductImages} />
      </div>

      <ProductPolicyCareFields productData={productData} setProductData={setProductData} />

      <ProductPricingInventoryFields
        productData={productData}
        setProductData={setProductData}
        inventoryOptions={inventoryOptions}
        editingProduct={editingProduct}
        onToggleStoreAddress={onToggleStoreAddress}
      />
    </div>
  );
}
