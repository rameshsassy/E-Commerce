import React, { useRef, useState } from 'react';
import { getImageUrl } from '../../../utils/api';
import { Upload, Trash2, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

const ImageUploadPreview = ({
  imageUrl,
  onFileSelect,
  onRemove,
  uploading,
  recommendationText = 'Recommended size: 1600px × 400px (4:1 Ratio)',
}) => {
  const fileInputRef = useRef(null);
  const [localPreview, setLocalPreview] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setValidationError('Please select a valid image format (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    setValidationError('');
    
    // Create local preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLocalPreview(reader.result);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleClear = () => {
    setLocalPreview('');
    setValidationError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  const displayImage = localPreview || (imageUrl ? getImageUrl(imageUrl) : '');

  return (
    <div className="flex flex-col gap-3 w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
      />

      {/* Preview container maintaining 4:1 aspect ratio */}
      <div 
        onClick={!displayImage && !uploading ? triggerFileSelect : undefined}
        className={`relative w-full aspect-[4/1] rounded-2xl border-2 border-dashed transition-all overflow-hidden flex items-center justify-center bg-zinc-950/45 ${
          displayImage ? 'border-glass-border' : 'border-glass-border hover:border-primary/50 cursor-pointer'
        }`}
      >
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt="Hero Banner Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark overlay for actions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={uploading}
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold border border-white/25"
              >
                <RefreshCw size={14} className={uploading ? 'animate-spin' : ''} /> Replace
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={uploading}
                className="p-3 bg-error/20 hover:bg-error/30 text-error-foreground rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold border border-error/25"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            {uploading ? (
              <>
                <Loader2 className="animate-spin text-primary" size={28} />
                <span className="text-sm text-text-muted font-medium">Uploading image...</span>
              </>
            ) : (
              <>
                <Upload className="text-text-muted" size={28} />
                <span className="text-sm font-semibold">Select banner image</span>
                <span className="text-xs text-text-muted">{recommendationText}</span>
              </>
            )}
          </div>
        )}
      </div>

      {validationError && (
        <div className="flex items-center gap-1.5 text-xs text-error font-medium">
          <AlertCircle size={14} /> {validationError}
        </div>
      )}
    </div>
  );
};

export default ImageUploadPreview;
