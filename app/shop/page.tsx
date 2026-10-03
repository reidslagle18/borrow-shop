"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MultiSelect from "@/components/MultiSelect";
import MarketingPopup from "@/components/MarketingPopup";
import PhotoCarousel from "@/components/PhotoCarousel";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import HeroMedia, { type HeroSlide } from "@/components/HeroMedia";
import TrustBadges from "@/components/TrustBadges";
import Testimonials, { type Testimonial } from "@/components/Testimonials";
import { PublicItem, EVENT_TYPES, SIZES, itemSlug } from "@/lib/types";

/* ---------------------------------------------------------------------------
   HOMEPAGE PHOTOGRAPHY — edit these two lists as you get more photos.

   HERO: 2+ images auto-advance as a slow crossfade carousel; 1 image is static.
   To use a background video instead, set HERO_VIDEO to its path (e.g. put
   hero.mp4 in /public/store and set "/store/hero.mp4"); the images become its
   poster/fallback. Drop new photos in /public/store and add their paths here.
--------------------------------------------------------------------------- */
const HERO_IMAGES: string[] = [
  "/store/space.jpg", // round table + mannequins against the forest mural
  "/store/sign.jpg", // the BORROW sign over the racks
  "/store/gowns.jpg", // sunlit gowns + mannequins
];
const HERO_VIDEO = ""; // e.g. "/store/hero.mp4" — leave "" for the image carousel

/* STUDIO GALLERY — the "A look inside" grid. Portrait shots of the racks,
   details, and the fitting room. Drop new photos in /public/store/gallery and
   add them here (src + a short alt description). */
const STUDIO_GALLERY: { src: string; alt: string }[] = [
  { src: "/store/gallery/rainbow.jpg", alt: "Dresses arranged by color against the forest mural" },
  { src: "/store/gallery/beaded.jpg", alt: "A beaded gown and pastel pieces on the Lemon Park wall" },
  { src: "/store/gallery/fitting-room.jpg", alt: "The floral fitting room with a gold sconce and mirror" },
  { src: "/store/gallery/owner-table.jpg", alt: "Browsing the racks at the BORROW studio" },
  { src: "/store/gallery/blues.jpg", alt: "A rack of blue dresses, tonal and elegant" },
  { src: "/store/gallery/lace.jpg", alt: "A white lace halter dress on the Lemon Park wall" },
  { src: "/store/gallery/owner-rack.jpg", alt: "Picking a piece from the color-sorted racks" },
  { src: "/store/gallery/warm.jpg", alt: "Pinks and reds gathered against the landscape mural" },
];

/* TESTIMONIALS — ⚠️ PLACEHOLDER quotes so you can see the layout. Replace with
   real customer reviews as you collect them (name, quote, optional stars 1–5,
   optional detail line). Delete any you don't want; the section hides itself if
   the list is empty. */
const TESTIMONIALS: Testimonial[] = [
  {
    name: "Placeholder — Ella R.",
    detail: "U of A '25",
    stars: 5,
    quote:
      "Found the perfect formal dress in ten minutes and paid a fraction of buying it. Pickup was so easy and it was spotless.",
  },
  {
    name: "Placeholder — Maggie T.",
    detail: "Fayetteville",
    stars: 5,
    quote:
      "I've rented three times now for gamedays and a wedding. Way better than my closet full of dresses I wore once.",
  },
  {
    name: "Placeholder — Sydney K.",
    detail: "U of A '26",
    stars: 5,
    quote:
      "The pieces are actually cute and current, not random. Borrow is my go-to for every date party now.",
  },
];

/** "Good to know" FAQ content (static). */
const FAQS = [
  {
    q: "How does sizing work?",
    a: "Every piece lists its size on the tag and its page, and you can filter the closet by your size. Sizes run true to the brand's own sizing, and we note fit quirks in the piece's description when they matter.",
  },
  {
    q: "What if it doesn't fit?",
    a: "Try it on at pickup, and if it isn't right we'll help you find a piece that is. Reservations are paid in full to hold the piece; cancel 48 or more hours before pickup and the rental price is refunded to your card (tax is non-refundable). Within 48 hours of pickup, no-shows, and after pickup are non-refundable.",
  },
  {
    q: "What's the Cleaning & Care Fee?",
    a: "It's already included in every rental price, so there's nothing extra to add at checkout. It covers professional cleaning and inspection between wears, so every piece arrives fresh. Please don't clean the piece yourself; just return it as-is and we take care of all cleaning. It isn't damage insurance, and renters are responsible for damage beyond normal wear.",
  },
  {
    q: "What if I return it late?",
    a: "Pieces are due back by day 7 so the next renter isn't left waiting. Late returns are charged $15 per item per day to the card on file, capped at the piece's replacement value.",
  },
  {
    q: "How does consignment work?",
    a: "Bring us the pieces you never reach for; we photograph, list, rent, and clean them, and you earn 20% of every rental, paid straight to your bank. Book a drop-off appointment to get started, and you can retrieve your pieces anytime they aren't rented or reserved.",
  },
];

/** Split a piece's comma-joined color string into individual colors. */
function itemColors(i: PublicItem): string[] {
  return (i.color || "").split(",").map((c) => c.trim()).filter(Boolean);
}

/** Split a piece's comma-joined silhouette string into individual silhouettes. */
function itemSilhouettes(i: PublicItem): string[] {
  return (i.silhouette || "").split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Some occasions map to an older "Event type" tag — so a piece tagged for the
 * event (e.g. "Game Day") also shows under the matching occasion pill, keeping
 * the occasion pill in sync with the event section without re-tagging. Keyed by
 * occasion name → the event_types that count as that occasion.
 */
const OCCASION_EVENT_ALIASES: Record<string, string[]> = {
  Gameday: ["Game Day"],
  "Date Night": ["Date Party", "Night Out"],
  Graduation: ["Graduation"],
};

/**
 * Does a piece match the active occasion (and optional sub-occasion)? A piece
 * matches an occasion if it's tagged with that occasion OR carries an equivalent
 * event_type (see OCCASION_EVENT_ALIASES); it matches a specific sub only if it
 * carries the namespaced "Occasion:Sub" tag.
 */
function matchesOccasion(
  i: PublicItem,
  occasion: string | null,
  sub: string | null
): boolean {
  if (!occasion) return true;
  if (sub) return (i.sub_occasion_tags ?? []).includes(`${occasion}:${sub}`);
  if ((i.occasion_tags ?? []).includes(occasion)) return true;
  const aliasEvents = OCCASION_EVENT_ALIASES[occasion];
  if (aliasEvents && (i.event_types ?? []).some((e) => aliasEvents.includes(e)))
    return true;
  return false;
}

/**
 * Top-level "Shop by" categories, powered by the silhouette field. Each maps to
 * one or more silhouettes; `subs` (when present) render a second row of pills.
 */
type Category = {
  label: string;
  sils: string[];
  subs?: { label: string; sil: string }[];
};
const CATEGORIES: Category[] = [
  {
    label: "Dresses",
    sils: ["Mini Dress", "Midi Dress", "Maxi Dress", "Gown"],
    subs: [
      { label: "Mini", sil: "Mini Dress" },
      { label: "Midi", sil: "Midi Dress" },
      { label: "Maxi", sil: "Maxi Dress" },
      { label: "Gown", sil: "Gown" },
    ],
  },
  { label: "Tops", sils: ["Top"] },
  { label: "Skirts", sils: ["Skirt"] },
  { label: "Pants", sils: ["Pants"] },
  { label: "Shorts", sils: ["Shorts"] },
  { label: "Jumpsuits", sils: ["Jumpsuit"] },
  { label: "Sets", sils: ["Matching Set", "Co-ord"] },
];

/** Case-insensitive search over the same fields as studio inventory search. */
// Light stemmer so "sparkle" matches "sparkly", "sequins" matches "sequin",
// etc. Never reduces a word below 3 chars (so "red" stays "red").
function stem(w: string): string {
  if (w.length <= 3) return w;
  // Strip a common trailing inflection. NOTE: no "ly" — it must reduce "sparkly"
  // to the same root ("sparkl") as "sparkle" (which drops "e"), so a search for
  // "sparkle" finds "sparkly".
  const s = w.replace(/(?:ies|es|ing|ed|s|y|e)$/i, "");
  return s.length >= 3 ? s : w;
}
function stemAll(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem)
    .join(" ");
}

/**
 * Unified, forgiving search across brand, color, description, silhouette, and
 * style tags. A multi-word query must match every word (AND), each matched on a
 * stemmed substring so plurals/partials still hit. Also matches the item id/
 * barcode outright for quick lookups.
 */
function matchesQuery(i: PublicItem, q: string): boolean {
  const query = q.trim().toLowerCase();
  if (!query) return true;
  if ((i.id || "").toLowerCase().includes(query)) return true;
  const haystack = stemAll(
    [i.brand, i.description, i.color, i.silhouette, ...(i.style_tags ?? [])]
      .filter(Boolean)
      .join(" ")
  );
  const tokens = query
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem);
  return tokens.every((t) => t.length > 0 && haystack.includes(t));
}

const PILL = "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors";
const pillCls = (active: boolean) =>
  `${PILL} ${
    active
      ? "border-ink bg-ink text-cream"
      : "border-ink/15 bg-white text-ink/70 hover:border-ink/35"
  }`;
const SUBPILL = "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors";
const subPillCls = (active: boolean) =>
  `${SUBPILL} ${
    active
      ? "border-blush-deep bg-blush text-ink"
      : "border-ink/15 bg-white text-ink/60 hover:border-ink/35"
  }`;

function money(n: number | string): string {
  return `$${Number(n)}`;
}

export default function Shop() {
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState("");
  const [fSizes, setFSizes] = useState<string[]>([]);
  const [fColors, setFColors] = useState<string[]>([]);
  const [fEvents, setFEvents] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null); // top-level pill
  const [sub, setSub] = useState<string | null>(null); // sub-pill silhouette
  const [sort, setSort] = useState("featured");
  const [reserved, setReserved] = useState<"confirming" | "done" | "error" | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [colorSwatches, setColorSwatches] = useState<Record<string, string>>({});
  const [heroSlides, setHeroSlides] = useState<HeroSlide[] | null>(null);
  const [occasions, setOccasions] = useState<{ name: string; subs: string[] }[]>([]);
  const [occasion, setOccasion] = useState<string | null>(null); // active occasion
  const [subOccasion, setSubOccasion] = useState<string | null>(null); // active sub
  const router = useRouter();

  // Deep links prefill the browse view: ?q= (search), ?category= (Shop by
  // Category), ?occasion= (Shop by Occasion) — used by the nav + homepage tiles.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const q = p.get("q");
    if (q) setQuery(q);
    const cat = p.get("category");
    if (cat) setCategory(cat);
    const occ = p.get("occasion");
    if (occ) setOccasion(occ);
  }, []);

  // Color-name → hex map for the filter swatches (owner-editable in Settings).
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c?.color_swatches && typeof c.color_swatches === "object") {
          setColorSwatches(c.color_swatches);
        }
        if (Array.isArray(c?.hero) && c.hero.length > 0) {
          setHeroSlides(c.hero as HeroSlide[]);
        }
        if (Array.isArray(c?.occasions)) {
          setOccasions(
            c.occasions.filter(
              (o: unknown): o is { name: string; subs: string[] } =>
                !!o && typeof (o as { name?: unknown }).name === "string"
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collection");
        if (!res.ok) throw new Error();
        setItems(await res.json());
      } catch {
        setError("The closet didn't load, refresh to try again.");
      }
    })();
  }, []);

  // Returning from Stripe Checkout (?reserved=<session_id>), confirm the reservation.
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("reserved");
    if (!sessionId) return;
    setReserved("confirming");
    // Fully covered by store credit → already booked server-side, nothing to fulfill.
    if (sessionId === "credit") {
      setReserved("done");
      window.history.replaceState({}, "", "/");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/fulfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        setReserved(res.ok ? "done" : "error");
      } catch {
        setReserved("error");
      }
      window.history.replaceState({}, "", "/");
    })();
  }, []);

  const sizeOptions = useMemo(() => {
    const present = new Set((items ?? []).map((i) => i.size));
    return SIZES.filter((s) => present.has(s));
  }, [items]);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((i) => itemColors(i).forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [items]);

  // Only show category pills that actually have matching inventory.
  const visibleCategories = useMemo(() => {
    const present = new Set<string>();
    (items ?? []).forEach((i) => itemSilhouettes(i).forEach((s) => present.add(s)));
    return CATEGORIES.filter((c) => c.sils.some((s) => present.has(s)));
  }, [items]);

  const activeCat = CATEGORIES.find((c) => c.label === category) ?? null;

  const eventOptions = useMemo(() => {
    const present = new Set<string>();
    (items ?? []).forEach((i) => (i.event_types || []).forEach((e) => present.add(e)));
    const ordered = EVENT_TYPES.filter((e) => present.has(e));
    const extras = Array.from(present).filter((e) => !EVENT_TYPES.includes(e)).sort();
    return [...ordered, ...extras];
  }, [items]);

  const list = useMemo(() => {
    let l = items ?? [];
    if (query.trim()) l = l.filter((i) => matchesQuery(i, query));
    // Category / sub-pill → silhouette filter.
    const silFilter = sub ? [sub] : activeCat ? activeCat.sils : [];
    if (silFilter.length)
      l = l.filter((i) => itemSilhouettes(i).some((s) => silFilter.includes(s)));
    if (fSizes.length) l = l.filter((i) => fSizes.includes(i.size));
    if (fColors.length)
      l = l.filter((i) => itemColors(i).some((c) => fColors.includes(c)));
    if (fEvents.length)
      l = l.filter((i) => (i.event_types || []).some((e) => fEvents.includes(e)));
    if (occasion) l = l.filter((i) => matchesOccasion(i, occasion, subOccasion));
    if (sort === "price-asc")
      l = [...l].sort((a, b) => Number(a.rental_price) - Number(b.rental_price));
    else if (sort === "price-desc")
      l = [...l].sort((a, b) => Number(b.rental_price) - Number(a.rental_price));
    return l;
  }, [items, query, category, sub, activeCat, fSizes, fColors, fEvents, occasion, subOccasion, sort]);

  function shopAll() {
    setCategory(null);
    setSub(null);
    setFSizes([]);
    setFColors([]);
    setFEvents([]);
    setQuery("");
    setOccasion(null);
    setSubOccasion(null);
  }

  const anyFilter =
    !!query.trim() ||
    !!category ||
    !!sub ||
    !!occasion ||
    fSizes.length > 0 ||
    fColors.length > 0 ||
    fEvents.length > 0;

  const activeOccasion = occasions.find((o) => o.name === occasion) ?? null;

  // A signature of the active view. Used as a React key on the results
  // container so a filter/search/category/sort change cross-fades the grid in
  // (via .animate-fade) instead of hard-swapping, with no layout shift.
  const filterKey = [
    query.trim(),
    category ?? "",
    sub ?? "",
    occasion ?? "",
    subOccasion ?? "",
    sort,
    fSizes.join("|"),
    fColors.join("|"),
    fEvents.join("|"),
  ].join("~");

  return (
    <main>
      {reserved && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-6"
          onClick={() => reserved !== "confirming" && setReserved(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-cream p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {reserved === "confirming" ? (
              <p className="text-[15px] text-ink/60">Confirming your reservation…</p>
            ) : reserved === "done" ? (
              <>
                <h2 className="font-serif text-4xl italic font-medium">You&apos;re reserved.</h2>
                <p className="mx-auto mt-4 max-w-xs text-[15px] leading-relaxed text-ink/60">
                  Payment received and your piece is held. We&apos;ll email your
                  confirmation and a pickup reminder, and all you have to do is pick it up.
                </p>
                <button
                  onClick={() => setReserved(null)}
                  className="mt-7 rounded-full bg-ink px-8 py-3.5 text-base text-cream"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-3xl italic font-medium">Hmm, one sec.</h2>
                <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-ink/60">
                  Your payment may have gone through but we couldn&apos;t confirm the
                  reservation here. Please DM @borrowfayetteville on Instagram and
                  we&apos;ll sort it right away.
                </p>
                <button
                  onClick={() => setReserved(null)}
                  className="mt-6 rounded-full border border-ink/15 px-6 py-3 text-[15px] text-ink/60"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <SiteNav />

      {/* Compact shop header */}
      <section className="mx-auto max-w-5xl px-5 pt-8 pb-1 text-center">
        <h1 className="font-serif text-4xl italic font-medium sm:text-5xl">Shop Rentals</h1>
        <p className="mt-1.5 text-[14px] text-ink/55">
          Search and filter by category, occasion, size, color, and more.
        </p>
      </section>

      {/* Search + Shop by categories */}
      <section id="closet" className="mx-auto w-full max-w-5xl px-5 scroll-mt-4">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, color, description, or item ID"
            aria-label="Search the closet"
            className="w-full rounded-full border border-ink/15 bg-white px-5 py-3 pr-11 text-base outline-none focus:border-ink/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 text-lg leading-none text-ink/40 hover:bg-ink/5"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 text-[12px] uppercase tracking-[0.18em] text-ink/45">
            Shop by:
          </span>
          <button onClick={shopAll} className={pillCls(!category)}>
            Shop All
          </button>
          {visibleCategories.map((c) => (
            <button
              key={c.label}
              onClick={() => {
                setCategory(c.label);
                setSub(null);
              }}
              className={pillCls(category === c.label)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {activeCat?.subs && (
          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setSub(null)} className={subPillCls(!sub)}>
              All {activeCat.label}
            </button>
            {activeCat.subs.map((s) => (
              <button
                key={s.sil}
                onClick={() => setSub(s.sil)}
                className={subPillCls(sub === s.sil)}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
        {occasions.length > 0 && (
          <div className="mt-3 border-t border-ink/10 pt-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[12px] uppercase tracking-[0.18em] text-ink/45">
                By occasion:
              </span>
              {occasions.map((o) => (
                <button
                  key={o.name}
                  onClick={() => {
                    const next = occasion === o.name ? null : o.name;
                    setOccasion(next);
                    setSubOccasion(null);
                  }}
                  className={pillCls(occasion === o.name)}
                >
                  {o.name}
                </button>
              ))}
            </div>
            {activeOccasion && activeOccasion.subs.length > 0 && (
              <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                <button
                  onClick={() => setSubOccasion(null)}
                  className={subPillCls(!subOccasion)}
                >
                  All {activeOccasion.name}
                </button>
                {activeOccasion.subs.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubOccasion(subOccasion === s ? null : s)}
                    className={subPillCls(subOccasion === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/size-guide"
            className="text-[12px] text-ink/45 underline underline-offset-2 hover:text-ink"
          >
            Not sure of your size? See the size guide →
          </Link>
          <Link
            href="/lookbook"
            className="text-[12px] text-ink/45 underline underline-offset-2 hover:text-ink"
          >
            Just browsing? See the full collection →
          </Link>
        </div>
      </section>

      {/* Filters + sort */}
      <section className="sticky top-0 z-30 mt-3 border-y border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <MultiSelect label="Event" options={eventOptions} selected={fEvents} onChange={setFEvents} />
          <MultiSelect label="Size" options={sizeOptions} selected={fSizes} onChange={setFSizes} />
          <MultiSelect label="Color" options={colorOptions} selected={fColors} onChange={setFColors} swatches={colorSwatches} />
          {anyFilter ? (
            <button
              onClick={shopAll}
              className="text-sm text-ink/45 underline underline-offset-2"
            >
              Clear all
            </button>
          ) : null}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="ml-auto rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm outline-none"
          >
            <option value="featured">Most loved</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        {error ? (
          <p className="py-20 text-center text-ink/50">{error}</p>
        ) : items === null ? (
          <div>
            <p className="mb-6 text-center font-serif text-2xl italic text-ink/40">
              Finding your perfect fit…
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/5"
                />
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="animate-rise py-20 text-center">
            <p className="font-serif text-3xl italic text-ink/40">
              {items.length === 0
                ? "The closet is being stocked"
                : occasion
                  ? "Nothing here yet — check back soon!"
                  : "Nothing matches those filters"}
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink/45">
              {items.length === 0
                ? "Check back soon, new pieces drop weekly."
                : occasion
                  ? `We're still adding pieces for ${
                      subOccasion ? `${occasion} · ${subOccasion}` : occasion
                    }. New arrivals drop weekly.`
                  : "Try broadening your search, or start fresh below."}
            </p>
            {items.length > 0 && (
              <button
                onClick={shopAll}
                className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-[15px] text-cream transition-transform hover:scale-[1.03]"
              >
                {anyFilter ? "Clear filters · Shop All" : "Shop All"}
              </button>
            )}
          </div>
        ) : (
          <div
            key={filterKey}
            className="animate-fade grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {list.map((item, idx) => {
              const cardPhotos = item.photos?.length
                ? item.photos
                : item.photo_url
                  ? [item.photo_url]
                  : [];
              const href = `/shop/${itemSlug(item)}`;
              return (
                <div
                  key={item.id}
                  className="animate-rise group text-left"
                  style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                >
                  {/* Fixed 3:4 frame, stays put as photos change; swipe/arrows
                      browse, a plain tap opens the piece's own page. */}
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/40">
                    <PhotoCarousel
                      photos={cardPhotos}
                      alt={`${item.brand} dress`}
                      onTap={() => router.push(href)}
                      arrowsOnHover
                      hoverPeek
                      overlay={
                        <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-full bg-cream/95 px-3 py-1 text-[13px] font-medium">
                          {money(item.rental_price)}
                        </span>
                      }
                    />
                  </div>
                  <Link
                    href={href}
                    className="block w-full px-1 pt-2.5 text-left"
                  >
                    <p className="truncate font-serif text-lg font-semibold leading-tight">
                      {item.brand}
                    </p>
                    <p className="mt-0.5 text-[13px] text-ink/50">
                      Size {item.size}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                    <p className="mt-0.5 text-[12px] text-sage-deep">
                      Cleaning &amp; Care Fee included
                    </p>
                    {item.retail_value != null && Number(item.retail_value) > 0 && (
                      <p className="mt-1 text-[14px] font-medium text-ink/55">
                        Retails for {money(item.retail_value)}
                      </p>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <SiteFooter />

      <MarketingPopup />
    </main>
  );
}
