import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BASE_URL } from '../../utils/api';

const ReviewImages = ({ images }) => {
  const [modalImage, setModalImage] = useState(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-3 mt-4">
        {images.map((img, idx) => (
          <div 
            key={idx} 
            onClick={() => setModalImage(img)}
            className="w-20 h-20 rounded-xl overflow-hidden cursor-pointer border border-glass-border hover:border-primary transition-all shadow-sm hover:shadow-md"
          >
            <img 
              src={`${BASE_URL}/${img.replace(/\\/g, '/')}`} 
              alt={`Review attachment ${idx + 1}`} 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
        ))}
      </div>

      {modalImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setModalImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 p-2 rounded-full backdrop-blur-md transition-colors"
            onClick={() => setModalImage(null)}
          >
            <X size={24} />
          </button>
          <img 
            src={`${BASE_URL}/${modalImage.replace(/\\/g, '/')}`} 
            alt="Review Preview" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl scale-100 animate-fade-in"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image itself
          />
        </div>
      )}
    </>
  );
};

export default ReviewImages;
