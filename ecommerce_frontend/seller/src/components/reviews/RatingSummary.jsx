import React from 'react';
import { Star } from 'lucide-react';

const RatingSummary = ({ reviews }) => {
  const totalReviews = reviews.length;
  
  const averageRating = totalReviews === 0 
    ? 0 
    : (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1);

  // Calculate breakdown
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach(r => breakdown[r.rating] = (breakdown[r.rating] || 0) + 1);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center bg-surface p-6 rounded-2xl border border-glass-border">
      {/* Left side: Big number */}
      <div className="flex flex-col items-center justify-center min-w-[150px] border-b md:border-b-0 md:border-r border-glass-border pb-6 md:pb-0 md:pr-8">
        <h2 className="text-6xl font-black text-white mb-2 flex items-baseline gap-1">
          {averageRating} <span className="text-2xl text-text-muted font-bold">/ 5</span>
        </h2>
        <div className="flex text-warning mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={20} fill={i < Math.round(averageRating) ? "currentColor" : "none"} />
          ))}
        </div>
        <p className="text-sm text-text-muted font-medium">{totalReviews} verified ratings</p>
      </div>

      {/* Right side: Progress bars */}
      <div className="flex-1 w-full flex flex-col gap-3">
        {[5, 4, 3, 2, 1].map(star => {
          const count = breakdown[star];
          const percentage = totalReviews === 0 ? 0 : Math.round((count / totalReviews) * 100);
          return (
            <div key={star} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-12 shrink-0 font-bold text-sm text-text-muted">
                {star} <Star size={14} className="text-warning" fill="currentColor"/>
              </div>
              <div className="flex-1 h-2.5 bg-surface-hover rounded-full overflow-hidden">
                <div 
                  className="h-full bg-warning rounded-full transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-10 text-right text-xs font-bold text-text-muted shrink-0">
                {percentage}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RatingSummary;
