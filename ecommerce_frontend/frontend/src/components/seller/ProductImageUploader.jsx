import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Eye } from 'lucide-react';
import {
  PRODUCT_IMAGE_MAX_COUNT,
  PRODUCT_IMAGE_MAX_BYTES,
} from '../../utils/productContentValidation';

function ImageZoomModal({ file, onSave, onCancel }) {
  const [zoom, setZoom] = useState(1);
  const [src, setSrc] = useState('');
  const imgRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleApply = () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;

    const out = 800;
    const canvas = document.createElement('canvas');
    canvas.width = out;
    canvas.height = out;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out, out);

    const minDim = Math.min(img.naturalWidth, img.naturalHeight);
    const cropSize = minDim / zoom;
    const sx = (img.naturalWidth - cropSize) / 2;
    const sy = (img.naturalHeight - cropSize) / 2;

    ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, out, out);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const name = (file.name || 'product.jpg').replace(/\.\w+$/i, '.jpg');
        const outFile = new File([blob], name, { type: 'image/jpeg' });
        onSave(outFile, canvas.toDataURL('image/jpeg', 0.9));
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 text-[#202223]">
        <h3 className="text-[16px] font-semibold mb-3">Adjust image</h3>
        <div className="w-full aspect-square bg-[#F6F6F7] border border-[#E1E3E5] rounded-lg overflow-hidden flex items-center justify-center mb-4">
          <img
            ref={imgRef}
            src={src}
            alt="Crop preview"
            className="max-w-full max-h-full object-contain transition-transform duration-150"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
        <label className="block text-[13px] text-[#6D7175] mb-1">
          Zoom {zoom < 1 ? 'out' : 'in'} ({Math.round(zoom * 100)}%)
        </label>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.05"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-[14px] border border-[#8C9196] rounded-md hover:bg-[#F6F6F7]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-2 text-[14px] bg-[#008060] text-white rounded-md hover:bg-[#006e52]"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * @param {{ images: Array<{id:string, preview:string, file?:File, existingPath?:string}>, onChange: Function }} props
 */
export default function ProductImageUploader({ images, onChange }) {
  const fileInputRef = useRef(null);
  const pendingSlotRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);

  const openPicker = (slotIndex) => {
    if (images.length >= PRODUCT_IMAGE_MAX_COUNT && slotIndex >= images.length) {
      window.alert(`You can upload up to ${PRODUCT_IMAGE_MAX_COUNT} images per product.`);
      return;
    }
    pendingSlotRef.current = slotIndex;
    fileInputRef.current?.click();
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      window.alert('Only JPG and PNG images are allowed.');
      return;
    }
    if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
      window.alert('Image must be 2 MB or smaller. It will be optimized to under 100 KB on upload.');
      return;
    }
    setPendingFile(file);
  };

  const handleSaveCropped = (file, preview) => {
    const slot = pendingSlotRef.current;
    const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const entry = { id, preview, file };

    if (slot != null && slot < images.length) {
      const next = [...images];
      next[slot] = entry;
      onChange(next);
    } else {
      onChange([...images, entry].slice(0, PRODUCT_IMAGE_MAX_COUNT));
    }
    setPendingFile(null);
    pendingSlotRef.current = null;
  };

  const removeAt = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const slots = Array.from({ length: PRODUCT_IMAGE_MAX_COUNT }, (_, i) => images[i] || null);

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-3">
        {slots.map((img, index) => (
          <div key={img?.id || `empty-${index}`} className="relative">
            <button
              type="button"
              onClick={() => (img ? openPicker(index) : openPicker(index))}
              className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-dashed border-[#8C9196] rounded-lg flex items-center justify-center bg-[#F6F6F7] hover:bg-[#F1F2F3] overflow-hidden"
            >
              {img?.preview ? (
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
              ) : (
                <Plus size={28} className="text-[#6D7175]" />
              )}
            </button>
            {img && (
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#202223] text-white flex items-center justify-center shadow"
                aria-label="Remove image"
              >
                <X size={14} />
              </button>
            )}
            {img?.preview && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const url = img.file ? URL.createObjectURL(img.file) : img.preview;
                  window.open(url, '_blank');
                }}
                className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-[#008060] text-white flex items-center justify-center shadow hover:bg-[#006e52]"
                aria-label="Preview image"
                title="Preview in new tab"
              >
                <Eye size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 text-[13px] text-[#202223]">
        <p className="font-medium mb-1">Main Image</p>
        <ul className="list-disc list-inside text-[#6D7175] space-y-0.5 text-[12px]">
          <li>Square images</li>
          <li>Less than 100 KB in file size (auto-optimized on upload)</li>
          <li>JPG or PNG format only</li>
          <li>Maximum {PRODUCT_IMAGE_MAX_COUNT} images</li>
        </ul>
      </div>

      {pendingFile && createPortal(
        <ImageZoomModal
          file={pendingFile}
          onCancel={() => {
            setPendingFile(null);
            pendingSlotRef.current = null;
          }}
          onSave={handleSaveCropped}
        />,
        document.body
      )}
    </div>
  );
}
