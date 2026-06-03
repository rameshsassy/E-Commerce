import { useMemo, useState } from 'react';
import { Plus, X, Image as ImageIcon } from 'lucide-react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { BASE_URL } from '../../utils/api';

const VARIANT_TYPES = [
  { key: 'color', label: 'Add Color Variant' },
  { key: 'size', label: 'Add Size Variant' },
  { key: 'material', label: 'Add Material/Fabric Variant' },
  { key: 'pattern', label: 'Add Pattern/Design Variant' },
  { key: 'weight', label: 'Add Weight Variant' },
  { key: 'custom', label: 'Add Custom Variant' },
];

function normalizeHex(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const withHash = s.startsWith('#') ? s : `#${s}`;
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(withHash)) return '';
  return withHash.toUpperCase();
}

function normalizeVariant(v) {
  return {
    type: v?.type || 'color',
    value: v?.value || '',
    colorHex: v?.colorHex || '',
    price: v?.price ?? '',
    compareAtPrice: v?.compareAtPrice ?? '',
    sku: v?.sku || '',
    dispatchDeliveryDays: v?.dispatchDeliveryDays ?? '',
    image: v?.image || '',
    imageFile: v?.imageFile || null,
    imagePreview: v?.imagePreview || '',
  };
}

function VariantImage({ variant, onPickFile }) {
  const src = variant.imagePreview
    ? variant.imagePreview
    : variant.image
      ? `${BASE_URL}/${String(variant.image).replace(/\\/g, '/')}`
      : '';

  return (
    <div className="flex items-start gap-4">
      <label className="w-20 h-20 border border-[#8C9196] rounded-md flex items-center justify-center bg-white cursor-pointer overflow-hidden">
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0] || null)}
        />
        {src ? (
          <img src={src} alt="Variant" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={22} className="text-[#6D7175]" />
        )}
      </label>
      <div className="text-[12px] text-[#6D7175]">
        <p className="font-medium text-[#202223] mb-1">Variant Image</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Square Images</li>
          <li>JPG or PNG format only</li>
        </ul>
        {src && (
          <button
            type="button"
            onClick={() => window.open(src, '_blank')}
            className="text-xs text-[#005bd3] hover:text-[#004bb4] underline font-semibold flex items-center gap-1 mt-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Preview image in new tab
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProductVariantsFields({ productData, setProductData }) {
  const [openType, setOpenType] = useState(null);
  const [draft, setDraft] = useState(() => normalizeVariant({}));

  const variants = Array.isArray(productData.variants) ? productData.variants : [];

  const grouped = useMemo(() => {
    const map = {};
    for (const t of VARIANT_TYPES) map[t.key] = [];
    for (const v of variants) {
      const type = v?.type;
      if (!type) continue;
      if (!map[type]) map[type] = [];
      map[type].push(v);
    }
    return map;
  }, [variants]);

  const startAdd = (type) => {
    setOpenType(type);
    setDraft(normalizeVariant({ type }));
  };

  const close = () => {
    setOpenType(null);
    setDraft(normalizeVariant({}));
  };

  const addVariant = () => {
    const value = String(draft.value || '').trim();
    if (!value) return;
    const colorHex =
      draft.type === 'color' ? normalizeHex(draft.colorHex) : '';
    const next = [
      ...variants,
      {
        type: draft.type,
        value,
        ...(draft.type === 'color' && colorHex ? { colorHex } : {}),
        price: draft.price === '' ? '' : Number(draft.price),
        compareAtPrice: draft.compareAtPrice === '' ? '' : Number(draft.compareAtPrice),
        sku: draft.sku || '',
        dispatchDeliveryDays:
          draft.dispatchDeliveryDays === '' ? '' : Number(draft.dispatchDeliveryDays),
        image: draft.image || '',
        imageFile: draft.imageFile || null,
        imagePreview: draft.imagePreview || '',
      },
    ];
    setProductData((prev) => ({ ...prev, variants: next }));
    close();
  };

  const removeVariant = (index) => {
    const next = variants.filter((_, i) => i !== index);
    setProductData((prev) => ({ ...prev, variants: next }));
  };

  const onPickFile = (file) => {
    if (!file) {
      setDraft((d) => ({ ...d, imageFile: null, imagePreview: '' }));
      return;
    }
    const ok = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
    if (!ok) return;
    const url = URL.createObjectURL(file);
    setDraft((d) => ({ ...d, imageFile: file, imagePreview: url }));
  };

  return (
    <div className="mt-8 border-t border-[#E1E3E5] pt-6">
      <div className="space-y-4">
        {VARIANT_TYPES.map((t) => (
          <div key={t.key} className="border border-[#E1E3E5] rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => (openType === t.key ? setOpenType(null) : startAdd(t.key))}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#F6F6F7] text-[#202223] font-semibold"
            >
              <span>{t.label}</span>
              <Plus size={20} />
            </button>

            {/* Collapsed summary chips */}
            {openType !== t.key && grouped[t.key]?.length > 0 && (
              <div className="px-4 py-3 bg-white flex flex-wrap gap-2">
                {grouped[t.key].slice(0, 6).map((v, idx) => (
                  <span
                    key={`${v.value}-${idx}`}
                    className="text-[12px] px-2 py-1 rounded-full border border-[#E1E3E5] bg-[#F6F6F7] text-[#202223]"
                  >
                    {t.key === 'color' && v?.colorHex ? (
                      <span
                        className="inline-block w-3 h-3 rounded-full mr-2 align-[-2px] border border-[#8C9196]"
                        style={{ backgroundColor: v.colorHex }}
                        title={v.colorHex}
                      />
                    ) : null}
                    {v.value}
                  </span>
                ))}
              </div>
            )}

            {/* Expanded detail form (like screenshot 1) */}
            {openType === t.key && (
              <div className="px-4 py-4 bg-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[14px] font-semibold text-[#202223]">
                    {t.label}
                  </div>
                  <button type="button" onClick={close} className="text-[#6D7175]">
                    <X size={18} />
                  </button>
                </div>

                <VariantImage variant={draft} onPickFile={onPickFile} />

                <div className="mt-5">
                  <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                    Mention Value
                  </label>
                  <input
                    type="text"
                    value={draft.value}
                    onChange={(e) => setDraft((d) => ({ ...d, value: e.target.value }))}
                    className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                    placeholder={t.key === 'color' ? 'e.g. Red' : 'Enter value'}
                  />
                  {t.key === 'color' && (
                    <p className="text-[12px] text-[#6D7175] mt-2">
                      Please add another variant for more colors
                    </p>
                  )}
                </div>

                {t.key === 'color' && (
                  <div className="mt-5">
                    <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                      Choose Color
                    </label>
                    {(() => {
                      const normalizedDraftHex = normalizeHex(draft.colorHex);
                      const effectiveHex = normalizedDraftHex || '#FFFFFF';
                      const wheelColor = effectiveHex;
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-[220px] max-w-full">
                              <HexColorPicker
                                color={wheelColor}
                                onChange={(c) => {
                                  const safe = normalizeHex(c) || wheelColor;
                                  setDraft((d) => ({
                                    ...d,
                                    colorHex: safe,
                                    value: String(d.value || '').trim() ? d.value : safe,
                                  }));
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="border border-[#E1E3E5] rounded-md p-4 bg-white">
                              <label className="block text-[13px] font-semibold text-[#202223] mb-2">
                                Enter HEX code
                              </label>
                              <HexColorInput
                                color={wheelColor}
                                onChange={(c) => {
                                  const safe = normalizeHex(c) || wheelColor;
                                  setDraft((d) => ({
                                    ...d,
                                    colorHex: safe,
                                    value: String(d.value || '').trim() ? d.value : safe,
                                  }));
                                }}
                                prefixed
                                placeholder="#87CEEB"
                                className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                              />
                              <p className="text-[12px] text-[#6D7175] mt-2">
                                Paste a hex code like <span className="font-medium">#87CEEB</span> to apply instantly.
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                      Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[#6D7175]">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.price}
                        onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                        className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                        placeholder="00.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                      Discounted Price
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-[#6D7175]">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={draft.compareAtPrice}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, compareAtPrice: e.target.value }))
                        }
                        className="w-full border border-[#8C9196] rounded-md pl-8 pr-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                        placeholder="00.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-semibold text-[#202223] mb-2">
                      SKU (Stock Keeping Unit)
                    </label>
                    <input
                      type="text"
                      value={draft.sku}
                      onChange={(e) => setDraft((d) => ({ ...d, sku: e.target.value }))}
                      className="w-full border border-[#8C9196] rounded-md px-3 py-2 text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                      placeholder="How many units are available for sale"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-[#202223] mb-2">
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
                        value={draft.dispatchDeliveryDays}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, dispatchDeliveryDays: e.target.value }))
                        }
                        className="w-16 border border-[#8C9196] rounded-md px-2 py-1 text-center text-[14px] text-[#202223] outline-none focus:ring-2 focus:ring-[#005bd3] focus:border-[#005bd3]"
                      />
                      <span className="text-[14px] text-[#202223]">Days</span>
                    </div>
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[13px] font-semibold text-[#202223] mb-2">
                      Existing variants
                    </p>
                    <div className="space-y-2">
                      {variants
                        .map((v, idx) => ({ v, idx }))
                        .filter(({ v }) => v?.type === t.key)
                        .map(({ v, idx }) => (
                          <div
                            key={`${v.type}-${v.value}-${idx}`}
                            className="flex items-center justify-between border border-[#E1E3E5] rounded-md px-3 py-2"
                          >
                            <div className="text-[13px] text-[#202223]">
                              {t.key === 'color' && v?.colorHex ? (
                                <span
                                  className="inline-block w-3 h-3 rounded-full mr-2 align-[-2px] border border-[#8C9196]"
                                  style={{ backgroundColor: v.colorHex }}
                                  title={v.colorHex}
                                />
                              ) : null}
                              <span className="font-medium">{v.value}</span>
                              {t.key === 'color' && v?.colorHex ? (
                                <span className="text-[#6D7175]"> • {v.colorHex}</span>
                              ) : null}
                              {v.price !== undefined && v.price !== '' && (
                                <span className="text-[#6D7175]"> • ₹{v.price}</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariant(idx)}
                              className="text-[#D82C0D] text-[13px]"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="bg-white border border-[#E1E3E5] hover:bg-[#F6F6F7] text-[#202223] font-medium py-2 px-4 rounded-md transition-all text-[14px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2 px-4 rounded-md transition-all text-[14px]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

