"use client";

import { useState } from "react";
import { useFavorites } from "@/lib/favorites";

/* A heart toggle for saving a piece. Two looks:
   - "overlay": a round, frosted button that sits over a product photo on cards.
   - "inline":  a labelled pill ("Save" / "Saved") for the product page.
   It stops click/navigation so tapping the heart on a card (which is wrapped in
   a link) never opens the piece or triggers the carousel. */

function Heart({ filled, className = "" }: { filled: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export default function HeartButton({
  itemId,
  variant = "overlay",
  className = "",
}: {
  itemId: string;
  variant?: "overlay" | "inline";
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(itemId);
  // Brief pop on tap for a little tactile feedback.
  const [pop, setPop] = useState(false);

  function onClick(e: React.MouseEvent) {
    // Cards wrap the heart in a link / have a tap handler — don't let either fire.
    e.preventDefault();
    e.stopPropagation();
    toggle(itemId);
    setPop(true);
    window.setTimeout(() => setPop(false), 180);
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={active ? "Remove from favorites" : "Save to favorites"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-[15px] font-medium transition-colors ${
          active
            ? "border-blush-deep bg-blush/35 text-ink"
            : "border-ink/15 bg-white text-ink/70 hover:border-ink/35"
        } ${className}`}
      >
        <Heart
          filled={active}
          className={`h-5 w-5 transition-transform ${active ? "text-blush-deep" : "text-ink/50"} ${
            pop ? "scale-125" : "scale-100"
          }`}
        />
        {active ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      className={`tap-target flex items-center justify-center rounded-full bg-cream/90 shadow-sm backdrop-blur transition-colors hover:bg-cream ${className}`}
    >
      <Heart
        filled={active}
        className={`h-[18px] w-[18px] transition-transform duration-150 ${
          active ? "text-blush-deep" : "text-ink/55"
        } ${pop ? "scale-125" : "scale-100"}`}
      />
    </button>
  );
}
