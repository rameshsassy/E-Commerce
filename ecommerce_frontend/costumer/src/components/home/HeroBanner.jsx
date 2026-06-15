import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function HeroBanner({ config }) {
  if (!config || !config.enabled) return null;

  const getImageUrl = (src) => {
    if (!src) return '';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    return src.startsWith('/') ? src : `/${src}`;
  };

  const hasImage = !!config.image;
  const imageSrc = getImageUrl(config.image);

  return (
    <section 
      className="relative w-full aspect-[2/1] sm:aspect-[3/1] lg:aspect-[4/1] bg-zinc-950 overflow-hidden shadow-elegant rounded-2xl md:rounded-[2rem] max-w-7xl mx-auto my-6 border border-border/20 group"
      aria-label="Hero Banner"
    >
      {/* Background Image / Gradient */}
      {hasImage ? (
        <>
          <img
            src={imageSrc}
            alt="Homepage Hero Banner"
            className="absolute inset-0 w-full h-full object-cover object-center scale-100 group-hover:scale-101 transition-transform duration-700 ease-out"
          />
          {/* Backdrop dimming filter to ensure text contrast/readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 z-10" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary-glow/15 to-transparent z-10" />
      )}

      {/* Hero Content Overlay */}
      <div
        className={cn(
          "absolute inset-0 p-6 sm:p-10 md:p-12 lg:p-16 flex flex-col justify-center text-white z-20 transition-all",
          config.headlineAlignment === 'left' ? 'items-start text-left' :
          config.headlineAlignment === 'right' ? 'items-end text-right' :
          'items-center text-center'
        )}
      >
        <div className="max-w-xl md:max-w-2xl flex flex-col gap-2 md:gap-3">
          {config.headlineEnabled && config.headline && (
            <h1 className="text-xl sm:text-2xl md:text-3.5xl lg:text-4.5xl font-extrabold tracking-tight leading-none drop-shadow-md select-none text-white animate-fade-in font-display">
              {config.headline}
            </h1>
          )}

          {config.subtitleEnabled && config.subtitle && (
            <p className="text-xs sm:text-sm md:text-base lg:text-lg text-zinc-200 font-medium leading-relaxed drop-shadow select-none max-w-lg animate-fade-in">
              {config.subtitle}
            </p>
          )}

          {config.ctaEnabled && config.ctaText && config.ctaLink && (
            <div className="mt-3 md:mt-4 animate-fade-in">
              <Button
                asChild
                style={{
                  backgroundColor: config.ctaColor || '#ffd401',
                  color: '#000000',
                }}
                className="font-extrabold uppercase text-[10px] sm:text-xs md:text-sm tracking-wider px-6 py-2.5 sm:py-5 md:py-6 rounded-full shadow-soft hover:brightness-105 hover:shadow-elegant active:scale-98 transition-all shrink-0"
              >
                <Link to={config.ctaLink}>
                  {config.ctaText}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroBanner;
