import React from 'react';
import { Star, ShieldCheck, User } from 'lucide-react';
import HelpfulReviewButton from './HelpfulReviewButton';
import ReviewImages from './ReviewImages';

const ReviewCard = ({ review, productId }) => {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-glass-border flex flex-col sm:flex-row gap-4 sm:gap-6 animate-fade-in">
      
      {/* User Info (Left Column on Desktop) */}
      <div className="w-full sm:w-48 shrink-0 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
            {review.user?.firstName?.charAt(0) || <User size={20} />}
          </div>
          <div>
            <h4 className="font-bold text-sm">{review.user?.firstName} {review.user?.lastName}</h4>
            <span className="text-[10px] text-text-muted">{new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric'})}</span>
          </div>
        </div>
        
        {review.isVerifiedPurchase && (
          <div className="flex items-center gap-1 mt-1 bg-success/10 text-success text-[10px] font-bold px-2 py-1 rounded-full w-fit border border-success/20">
            <ShieldCheck size={12} /> Verified Purchase
          </div>
        )}
      </div>

      {/* Review Content */}
      <div className="flex-1">
        <div className="flex text-warning mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} />
          ))}
        </div>
        
        <p className="text-text-muted leading-relaxed text-sm whitespace-pre-wrap">{review.comment}</p>
        
        {/* Gallery */}
        <ReviewImages images={review.images} />

        {/* Action Bar */}
        <div className="mt-6 flex justify-end">
          <HelpfulReviewButton 
            reviewId={review._id} 
            initialVotes={review.helpfulVotes} 
            productId={productId} 
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
