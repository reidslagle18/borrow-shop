"use client";

import { useCallback, useEffect, useState } from "react";

/* ---------------------------------------------------------------------------
   Favorites ("hearts") — a shopper's saved pieces, kept on their own device so
   it works with no account and no login. Stored in localStorage as a list of
   item ids, newest first. A tiny pub/sub keeps every heart on the page and the
   nav badge in sync the instant one is tapped, and the native `storage` event
   syncs across tabs. SSR-safe: everything guards `window`, and the hook starts
   empty so the server and first client render match (no hydration mismatch).
--------------------------------------------------------------------------- */

const KEY = "borrow_favorites";
// Same-tab change signal (the `storage` event only fires in *other* tabs).
const EVENT = "borrow-favorites-change";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function write(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* private mode / quota — the in-memory state below still updates the UI */
  }
  // Let every mounted heart + the nav badge re-read, this tab included.
  window.dispatchEvent(new Event(EVENT));
}

/** Add or remove a piece from favorites. New favorites go to the front so the
 *  favorites page reads newest-first. */
export function toggleFavorite(id: string): void {
  if (!id) return;
  const cur = read();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
  write(next);
}

/**
 * Subscribe to the shopper's favorites. Returns the saved ids (newest first), a
 * count for the nav badge, and `isFavorite` / `toggle` helpers. Re-renders
 * whenever favorites change anywhere (this tab or another).
 */
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const sync = () => setIds(read());
    sync(); // hydrate from storage after mount
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isFavorite = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((id: string) => toggleFavorite(id), []);

  return { ids, count: ids.length, isFavorite, toggle };
}
