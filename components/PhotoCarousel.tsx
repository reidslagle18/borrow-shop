"use client";

import { useRef, useState } from "react";

/**
 * Swipeable photo gallery for a piece. Smooth transform-based sliding that
 * works with touch/mouse drag, arrow buttons, and tappable dots. Loops
 * seamlessly by rendering a clone of the first/last photo on each end and
 * jumping (without animation) once a wrap transition finishes.
 */
export default function PhotoCarousel({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const n = photos.length;

  // Hooks must run unconditionally (single-photo case is handled in render).
  const [index, setIndex] = useState(1); // position in the extended (cloned) list
  const [animate, setAnimate] = useState(true);
  const [drag, setDrag] = useState(0); // live finger/mouse offset in px
  const startX = useRef<number | null>(null);
  const widthRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);

  if (n <= 1) {
    return (
      <div className="h-full w-full">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-6xl italic text-ink/20">
            {alt.charAt(0)}
          </div>
        )}
      </div>
    );
  }

  // [lastClone, ...real, firstClone] → positions 1..n are the real photos.
  const ext = [photos[n - 1], ...photos, photos[0]];
  const real = (((index - 1) % n) + n) % n;

  function go(to: number) {
    setAnimate(true);
    setIndex(to);
  }

  function onTransitionEnd() {
    // Landed on a clone → jump instantly to its real twin so it can keep going.
    if (index === n + 1) {
      setAnimate(false);
      setIndex(1);
    } else if (index === 0) {
      setAnimate(false);
      setIndex(n);
    }
  }

  function onDown(e: React.PointerEvent) {
    startX.current = e.clientX;
    widthRef.current = containerRef.current?.offsetWidth || 1;
    setAnimate(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDrag(e.clientX - startX.current);
  }
  function onUp() {
    if (startX.current == null) return;
    const d = drag;
    startX.current = null;
    setDrag(0);
    const threshold = Math.min(60, widthRef.current * 0.15);
    if (d < -threshold) go(index + 1);
    else if (d > threshold) go(index - 1);
    else go(index); // snap back
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      tabIndex={0}
    >
      <div
        className="flex h-full"
        style={{
          transform: `translateX(calc(${-index * 100}% + ${drag}px))`,
          transition: animate ? "transform 320ms cubic-bezier(0.22,1,0.36,1)" : "none",
          touchAction: "pan-y",
        }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onTransitionEnd={onTransitionEnd}
      >
        {ext.map((src, i) => (
          <div key={i} className="h-full w-full flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          </div>
        ))}
      </div>

      {/* Arrows (shown on pointer devices) */}
      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous photo"
        className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/85 px-2.5 py-1.5 text-lg leading-none text-ink/70 shadow-sm backdrop-blur hover:bg-cream sm:block"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next photo"
        className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-cream/85 px-2.5 py-1.5 text-lg leading-none text-ink/70 shadow-sm backdrop-blur hover:bg-cream sm:block"
      >
        ›
      </button>

      {/* Dots — count, current, and tap-to-jump */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i + 1)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-2 rounded-full shadow-sm transition-all ${
              i === real ? "w-5 bg-cream" : "w-2 bg-cream/60 hover:bg-cream/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
