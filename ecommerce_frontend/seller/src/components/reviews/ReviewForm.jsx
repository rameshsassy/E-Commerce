import React, { useState } from 'react';
import { Star, Image as ImageIcon, Send, X, Eye } from 'lucide-react';
import api from '../../utils/api';
import { compressAndStandardizeImage } from '../../utils/imageCompression';
import { useAuth } from '../../context/AuthContext';

const ReviewForm = ({ productId, onReviewAdded }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [compressing, setCompressing] = useState(false);

  const handleImageChange = async (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, 3);
      try {
        setCompressing(true);
        const compressedFiles = [];
        for (const file of selectedFiles) {
          if (file.type.startsWith('image/')) {
            const compressed = await compressAndStandardizeImage(file);
            compressedFiles.push(compressed);
          } else {
            compressedFiles.push(file);
          }
        }
        setImages(compressedFiles);
      } catch (err) {
        alert(err.message || 'Image could not be optimized. Please upload a different image.');
      } finally {
        setCompressing(false);
      }
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError("Please select a rating.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('rating', rating);
    formData.append('comment', comment);
    images.forEach(img => formData.append('images', img));

    try {
      const { data } = await api.post(`/products/${productId}/reviews`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess("Thank you for your review!");
      setRating(0);
      setComment('');
      setImages([]);
      if (onReviewAdded) onReviewAdded(data.review);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-glass-border text-center">
        <h3 className="font-bold mb-2">Write a Review</h3>
        <p className="text-text-muted text-sm">You must be logged in to review this product.</p>
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-glass-border">
      <h3 className="font-bold text-xl mb-4">Write a Review</h3>
      
      {error && <p className="text-error text-sm mb-4 p-3 bg-error/10 rounded-lg">{error}</p>}
      {success && <p className="text-success text-sm mb-4 p-3 bg-success/10 rounded-lg">{success}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-muted mb-2">Overall Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star}
                size={32}
                className="cursor-pointer transition-transform hover:scale-110"
                fill={(hoverRating || rating) >= star ? "#fbbf24" : "transparent"}
                color={(hoverRating || rating) >= star ? "#fbbf24" : "#475569"}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-text-muted mb-2">Your Review</label>
          <textarea 
            rows="4" 
            required
            placeholder="What did you like or dislike? How did you use the product?" 
            className="input-field resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          ></textarea>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-muted mb-2 flex items-center gap-2">
            <ImageIcon size={16} /> Add Photos (Optional)
          </label>
          
          <div className="flex flex-wrap gap-4 items-center">
            {images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-glass-border group">
                <img src={URL.createObjectURL(img)} alt="upload preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => window.open(URL.createObjectURL(img), '_blank')}
                    className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                    title="Preview in new tab"
                  >
                    <Eye size={16} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="p-1 rounded bg-white/20 hover:bg-white/40 text-white"
                    title="Remove"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            {images.length < 3 && (
              <label className="w-20 h-20 rounded-lg border-2 border-dashed border-glass-border flex flex-col items-center justify-center text-text-muted hover:bg-surface-hover hover:text-text cursor-pointer transition-colors">
                <ImageIcon size={24} className="mb-1" />
                <span className="text-[10px] font-medium">Add Photo</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>
          <p className="text-xs text-text-muted mt-2">Upload up to 3 images showing the product.</p>
        </div>

        <button 
          type="submit" 
          disabled={loading || !rating}
          className="btn btn-primary w-full md:w-auto px-8 py-3 flex items-center justify-center gap-2"
        >
          {loading ? 'Submitting...' : <><Send size={18} /> Submit Review</>}
        </button>
      </form>

      {compressing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70 text-white gap-3">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm font-medium">Compressing and optimizing images...</p>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;
