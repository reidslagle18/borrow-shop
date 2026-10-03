"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children with a soft fade-and-rise the first time they enter the
 * viewport. Uses a scroll/resize + rect check (reliable everywhere) rather than
 * IntersectionObserver, and inline styles so it wins the cascade cleanly under
 * Tailwind v4. Content in view at load reveals immediately; reduced-motion
 * users get it instantly; a safety timeout guarantees nothing ever stays hidden.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setInstant(true);
      setVisible(true);
      return;
    }

    let done = false;
    let ticking = false;
    const cleanup = () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(safety);
    };
    const reveal = () => {
      if (done) return;
      done = true;
      setVisible(true);
      cleanup();
    };
    const check = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Reveal once the element's top rises into the lower ~90% of the viewport.
      if (r.top < vh * 0.9 && r.bottom > 0) reveal();
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        check();
      });
    };

    // Safety net: reveal after a few seconds no matter what, so content can
    // never be stranded invisible (off-screen reveals are harmless). Declared
    // BEFORE the initial check() — if the element is already in view, check()
    // reveals synchronously and its cleanup calls clearTimeout(safety); with the
    // declaration after check(), that read hit the temporal dead zone and threw
    // "Cannot access 'safety' before initialization", crashing the whole tree.
    const safety = setTimeout(reveal, 4000);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    check(); // in-view at load → reveal right away
    return cleanup;
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(18px)",
        transition: instant
          ? "none"
          : "opacity 0.4s ease-out, transform 0.4s ease-out",
        transitionDelay: !instant && delay ? `${delay}ms` : undefined,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
