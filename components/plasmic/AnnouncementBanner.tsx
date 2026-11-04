"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* A slim announcement strip for the top of a page. On-brand tones only, and it
   can be dismissed (remembered per browser). Visual layer only. */
export default function AnnouncementBanner({
  text = "Free local pickup in Fayetteville · New arrivals every week",
  linkLabel = "",
  linkHref = "",
  tone = "Sage",
  dismissible = true,
  storageKey = "borrow_announcement",
}: {
  text?: string;
  linkLabel?: string;
  linkHref?: string;
  tone?: "Sage" | "Pink" | "Yellow" | "Black";
  dismissible?: boolean;
  storageKey?: string;
}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!dismissible) return;
    try {
      if (localStorage.getItem(storageKey) === "1") setHidden(true);
    } catch {
      /* private mode — just show it */
    }
  }, [dismissible, storageKey]);

  if (hidden) return null;

  const toneCls =
    tone === "Black"
      ? "bg-ink text-cream"
      : tone === "Pink"
        ? "bg-petal text-ink"
        : tone === "Yellow"
          ? "bg-butter/70 text-ink"
          : "bg-sage/40 text-ink";

  return (
    <div className={`relative w-full ${toneCls} px-9 py-2.5 text-center`}>
      <span className="text-[13px] font-medium tracking-[0.02em]">
        {text}
        {linkLabel && linkHref && (
          <Link href={linkHref} className="ml-2 underline underline-offset-2 hover:opacity-70">
            {linkLabel}
          </Link>
        )}
      </span>
      {dismissible && (
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(storageKey, "1");
            } catch {
              /* ignore */
            }
            setHidden(true);
          }}
          aria-label="Dismiss announcement"
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-lg leading-none hover:opacity-60"
        >
          ×
        </button>
      )}
    </div>
  );
}
