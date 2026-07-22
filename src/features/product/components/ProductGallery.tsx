'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/shared/utils/cn';

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToIndex = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    slide.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || images.length <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { index: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const raw = (entry.target as HTMLElement).dataset.index;
          const index = raw != null ? Number(raw) : NaN;
          if (Number.isNaN(index)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { index, ratio: entry.intersectionRatio };
          }
        }
        if (best) setActiveIndex(best.index);
      },
      { root: track, threshold: 0.6 },
    );

    for (const slide of slideRefs.current) {
      if (slide) observer.observe(slide);
    }
    return () => observer.disconnect();
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-brand-blush" />
    );
  }

  const multi = images.length > 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={trackRef}
        className={cn(
          'no-scrollbar relative flex aspect-square snap-x snap-mandatory overflow-x-auto overflow-y-hidden rounded-lg bg-brand-blush',
          !multi && 'overflow-hidden',
        )}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} images`}
      >
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            data-index={index}
            className="relative aspect-square w-full shrink-0 snap-center"
            role="group"
            aria-roledescription="slide"
            aria-label={`Image ${index + 1} of ${images.length}`}
          >
            <Image
              src={image}
              alt={index === 0 ? name : `${name} — image ${index + 1}`}
              width={720}
              height={720}
              priority={index === 0}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Mobile dots */}
      {multi ? (
        <div
          className="flex items-center justify-center gap-1.5 md:hidden"
          role="tablist"
          aria-label="Gallery pages"
        >
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to image ${index + 1}`}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'size-2 rounded-full transition-colors',
                index === activeIndex
                  ? 'bg-brand-primary'
                  : 'bg-border-strong',
              )}
            />
          ))}
        </div>
      ) : null}

      {/* Desktop thumbnails */}
      {multi ? (
        <div className="hidden gap-3 md:flex">
          {images.map((image, index) => (
            <button
              key={`${image}-thumb-${index}`}
              type="button"
              aria-label={`View image ${index + 1} of ${name}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => scrollToIndex(index)}
              className={cn(
                'relative aspect-square w-20 overflow-hidden rounded-(--radius) border-2 transition-colors',
                index === activeIndex
                  ? 'border-brand-primary'
                  : 'border-transparent hover:border-border-strong',
              )}
            >
              <Image
                src={image}
                alt=""
                width={160}
                height={160}
                sizes="80px"
                className="size-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
