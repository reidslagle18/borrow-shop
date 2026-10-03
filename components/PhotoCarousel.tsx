"use client";

import { useRef, useState } from "react";

/**
 * Photo gallery built on native CSS scroll-snap, iOS/Android do the swiping,
 * so it feels seamless (momentum, rubber-band, and correct tap-vs-swipe with no
 * JS gesture math). Dots track the current photo; arrows (desktop) and dot taps
 * scroll to a photo. A plain tap fires onTap (used on grid cards to open the
 * item), the browser suppresses the click after a swipe, so browsing never
 * opens the item by accident.
 */
export default function PhotoCarousel({
  photos,
  alt,
  onTap,
  arrowsOnHover = false,
  fit = "cover",
  overlay,
}: {
  photos: string[];
  alt: string;
  onTap?: () => void;
  arrowsOnHover?: boolean;
  fit?: "cover" | "contain";
  overlay?: React.ReactNode;
}) {
  const n = photos.length;
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  function scrollToIndex(i: number) {
    const el = scroller.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(n - 1, i));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const el = scroller.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  }

  if (n === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center font-serif text-6xl italic text-ink/20"
        onClick={onTap}
        style={onTap ? { cursor: "pointer" } : undefined}
      >
        {alt.charAt(0)}
        {overlay}
      </div>
    );
  }

  const arrowBase =
    "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/85 px-2.5 py-1.5 text-lg leading-none text-ink/70 shadow-sm backdrop-blur hover:bg-cream";
  const arrowVis = arrowsOnHover
    ? "hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
    : "hidden sm:block";

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Native horizontal scroll-snap track */}
      <div
        ref={scroller}
        onScroll={onScroll}
        onClick={onTap}
        style={onTap ? { cursor: "pointer" } : undefined}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((src, i) => (
          <div key={i} className="h-full w-full flex-none snap-center snap-always">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              loading={i === 0 ? "eager" : "lazy"}
              className={`pointer-events-none h-full w-full select-none ${fitClass}`}
            />
          </div>
        ))}
      </div>

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.stopPropagation();
              scrollToIndex(index - 1);
            }}
            className={`${arrowBase} left-2 ${arrowVis}`}
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.stopPropagation();
              scrollToIndex(index + 1);
            }}
            className={`${arrowBase} right-2 ${arrowVis}`}
          >
            ›
          </button>

          {/* Dots, bigger hit area than they look, for easy tapping */}
          <div className="absolute inset-x-0 bottom-1 z-10 flex justify-center">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to photo ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  scrollToIndex(i);
                }}
                className="flex items-center justify-center px-1 py-2.5"
              >
                <span
                  className={`h-2 rounded-full shadow-sm transition-all ${
                    i === index ? "w-5 bg-cream" : "w-2 bg-cream/70"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}

      {overlay}
    </div>
  );
}
