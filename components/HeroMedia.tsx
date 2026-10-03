"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";

/**
 * The homepage hero backdrop. Three modes, chosen automatically from what's
 * provided — so more photos (or a video) can be added later with zero code
 * changes:
 *   • video set        → a muted, looping background video (poster = first image)
 *   • 2+ images        → a slow auto-advancing crossfade carousel
 *   • 1 image (or none)→ a single static image (the original behaviour)
 * The caption/overlay is passed as children so it always sits on top. Honors
 * prefers-reduced-motion: no auto-advance, no video autoplay, no slow pan.
 */
export type HeroSlide = { src: string; posX: number; posY: number; zoom: number };

export default function HeroMedia({
  images,
  slides: cropped,
  video,
  intervalMs = 6000,
  alt = "Inside the BORROW studio in Fayetteville",
  children,
}: {
  images: string[];
  /** Owner-cropped slides from the studio. When present, these win over
   *  `images` and each renders with its saved focal point + zoom (no auto-pan). */
  slides?: HeroSlide[];
  video?: string;
  intervalMs?: number;
  alt?: string;
  children?: ReactNode;
}) {
  const custom = cropped && cropped.length > 0 ? cropped : null;
  const slides = custom
    ? custom.map((s) => s.src)
    : images.length > 0
      ? images
      : ["/store/space.jpg"];
  const [idx, setIdx] = useState(0);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const apply = () => setReduce(mq.matches);
    apply();
    mq.addEventListener?.("change", apply);
    return () => mq.removeEventListener?.("change", apply);
  }, []);

  const useVideo = !!video && !reduce;

  // Slow auto-advance for the crossfade carousel (paused for video / reduced
  // motion / a single image).
  useEffect(() => {
    if (useVideo || reduce || slides.length < 2) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % slides.length),
      Math.max(2500, intervalMs)
    );
    return () => clearInterval(t);
  }, [useVideo, reduce, slides.length, intervalMs]);

  return (
    <div className="group relative mt-4 h-[56vh] min-h-[360px] max-h-[600px] w-full overflow-hidden">
      {useVideo ? (
        <video
          className="absolute inset-0 h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          poster={slides[0]}
        >
          <source src={video} type="video/mp4" />
        </video>
      ) : (
        slides.map((src, i) => {
          const c = custom?.[i];
          return (
            <Image
              key={`${src}-${i}`}
              src={src}
              alt={alt}
              fill
              priority={i === 0}
              quality={90}
              sizes="100vw"
              className={`object-cover transition-opacity duration-[1500ms] ease-in-out ${
                c ? "" : "object-center"
              } ${reduce || c ? "" : "hero-pan"}`}
              style={{
                opacity: i === idx ? 1 : 0,
                ...(c
                  ? {
                      objectPosition: `${c.posX}% ${c.posY}%`,
                      transform: c.zoom !== 1 ? `scale(${c.zoom})` : undefined,
                      transformOrigin: `${c.posX}% ${c.posY}%`,
                    }
                  : {}),
              }}
            />
          );
        })
      )}

      {/* Legibility gradient, then the caption on top. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/25 to-transparent" />
      {children}
    </div>
  );
}
