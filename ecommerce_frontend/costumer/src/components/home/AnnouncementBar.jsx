import React from 'react';

export function AnnouncementBar({ config }) {
  if (!config || !config.enabled || !config.text?.trim()) return null;

  const isLongText = config.text.length > 55;

  return (
    <div
      role="region"
      aria-label="Announcement"
      style={{
        backgroundColor: config.backgroundColor || '#000000',
        color: config.textColor || '#ffffff',
      }}
      className="w-full py-2 px-4 text-xs font-semibold overflow-hidden relative z-50 select-none shadow-sm flex items-center justify-center shrink-0 min-h-[36px]"
    >
      <style>{`
        @keyframes customerMarquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .customer-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: customerMarquee 20s linear infinite;
        }
        .customer-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      {isLongText ? (
        <div className="w-full overflow-hidden relative flex items-center">
          <div className="customer-marquee w-full cursor-pointer">
            {config.text}
          </div>
        </div>
      ) : (
        <div className="text-center truncate max-w-full px-4">
          {config.text}
        </div>
      )}
    </div>
  );
}

export default AnnouncementBar;
