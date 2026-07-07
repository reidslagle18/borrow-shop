"use client";

import { useRef, useState } from "react";

/**
 * Swipeable photo gallery for a piece. Smooth transform-based sliding that works
 * with touch/mouse drag, arrow buttons, and tappable dots; loops seamlessly via
 * first/last clones. Fills its parent, so the parent sets the fixed frame size.
 *
 * onTap: when set, a tap/click (as opposed to a drag) fires it — used on grid
 * cards so browsing photos changes the image while a plain tap opens the item.
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

  // Hooks must run unconditionally (single-photo case is handled in render).
  const [index, setIndex] = useState(1); // position in the extended (cloned) list
  const [animate, setAnimate] = useState(true);
  const [drag, setDrag] = useState(0); // live finger/mouse offset in px
  const startX = useRef<number | null>(null);
  const startY = useRef(0);
  const widthRef = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const tapProps = onTap
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick: onTap,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") onTap();
        },
        style: { cursor: "pointer" as const },
      }
    : {};

  if (n <= 1) {
    return (
      <div className="relative h-full w-full" {...tapProps}>
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photos[0]} alt={alt} className={`h-full w-full ${fitClass}`} />
        ) : (
          <div className="flex h-full items-center justify-center font-serif text-6xl italic text-ink/20">
            {alt.charAt(0)}
          </div>
        )}
        {overlay}
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
    startY.current = e.clientY;
    widthRef.current = containerRef.current?.offsetWidth || 1;
    setAnimate(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    if (startX.current == null) return;
    setDrag(e.clientX - startX.current);
  }
  function onUp(e: React.PointerEvent) {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    startX.current = null;
    setDrag(0);
    // A mostly-vertical move is a page scroll — never open or change photo.
    if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) return;
    // Barely moved at all = a tap → open the item.
    if (Math.abs(dx) <= 8 && Math.abs(dy) <= 8) {
      if (onTap) onTap();
      return;
    }
    // Clear horizontal swipe → change photo; small nudge → snap back.
    const threshold = Math.min(60, widthRef.current * 0.15);
    if (dx < -threshold) go(index + 1);
    else if (dx > threshold) go(index - 1);
    else go(index);
  }
  // The browser took over the gesture (iOS fires this for scrolls AND, often,
  // mid horizontal-swipe). Finish the swipe from how far we'd dragged
  // horizontally — but never open the item — so swiping photos still works
  // while a vertical scroll just snaps back.
  function onCancel() {
    if (startX.current == null) return;
    const d = drag;
    startX.current = null;
    setDrag(0);
    const threshold = Math.min(60, widthRef.current * 0.15);
    if (d < -threshold) go(index + 1);
    else if (d > threshold) go(index - 1);
    else go(index);
  }

  const arrowBase =
    "absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-cream/85 px-2.5 py-1.5 text-lg leading-none text-ink/70 shadow-sm backdrop-blur hover:bg-cream";
  const arrowVis = arrowsOnHover
    ? "hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100 sm:block"
    : "hidden sm:block";

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
        onPointerCancel={onCancel}
        onTransitionEnd={onTransitionEnd}
      >
        {ext.map((src, i) => (
          <div key={i} className="h-full w-full flex-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              draggable={false}
              loading="lazy"
              className={`h-full w-full select-none ${fitClass}`}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => go(index - 1)}
        aria-label="Previous photo"
        className={`${arrowBase} left-2 ${arrowVis}`}
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => go(index + 1)}
        aria-label="Next photo"
        className={`${arrowBase} right-2 ${arrowVis}`}
      >
        ›
      </button>

      {/* Dots — count, current, and tap-to-jump */}
      <div className="absolute inset-x-0 bottom-2.5 z-10 flex justify-center gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i + 1)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-2 rounded-full shadow-sm transition-all ${
              i === real ? "w-5 bg-cream" : "w-2 bg-cream/70 hover:bg-cream"
            }`}
          />
        ))}
      </div>

      {overlay}
    </div>
  );
}
