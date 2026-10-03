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

      {/* Hero */}
      <section>
        <HeroMedia
          images={HERO_IMAGES}
          slides={heroSlides ?? undefined}
          video={HERO_VIDEO || undefined}
        >
          <div className="animate-rise absolute inset-x-0 bottom-0 p-6 pb-8 text-center sm:pb-12">
            <h1 className="font-serif text-6xl italic font-medium tracking-tight text-cream drop-shadow-sm sm:text-7xl">
              BORROW
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[16px] leading-relaxed text-cream/90 sm:text-[17px]">
              Rent your outfit, save the stress.
            </p>
          </div>
        </HeroMedia>
        <div className="animate-rise px-6 pb-10 pt-7 text-center">
          <p className="mx-auto max-w-md text-[17px] leading-relaxed text-ink/65">
            A curated closet for formals, date parties, wedding guests, game
            days, and more, yours for the week.
          </p>
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink/45">
            <span>Find your outfit</span>
            <span className="text-blush-deep">·</span>
            <span>Book your week</span>
            <span className="text-blush-deep">·</span>
            <span>Return by day 7</span>
          </div>
        </div>
      </section>

      {/* Consign / drop-off call-out, sits above the closet so it's easy to find */}
      <section className="px-5 pb-10">
        <Reveal className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-blush/45 px-6 py-8 text-center sm:flex-row sm:justify-between sm:gap-8 sm:px-10 sm:text-left">
          <div>
            <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
              Consign with Borrow
            </p>
            <h2 className="mt-1.5 font-serif text-2xl italic font-medium sm:text-3xl">
              Have pieces to drop off?
            </h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink/65">
              Bring in the dresses you&apos;re done with, and you earn 20% every
              time one rents. Book a quick appointment and we&apos;ll handle the
              rest.
            </p>
          </div>
          <a
            href="/dropoff"
            className="inline-block w-full shrink-0 rounded-full bg-ink px-8 py-4 text-center text-[15px] font-medium text-cream transition-transform hover:scale-[1.03] sm:w-auto"
          >
            Book a drop-off →
          </a>
        </div>
        </Reveal>
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

      {/* How it works */}
      <section className="border-t border-ink/10 bg-white/50 px-6 py-16 sm:py-20">
        <Reveal>
        <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">1</p>
            <h3 className="mt-1 text-xl font-medium">Pick your favorite</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Browse the closet by event or size. Every piece is cleaned and
              inspected between wears.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">2</p>
            <h3 className="mt-1 text-xl font-medium">Book your week</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Choose your pickup day, and the dress is yours for 7 days. Pay at
              pickup.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">3</p>
            <h3 className="mt-1 text-xl font-medium">Wear &amp; return</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Live your night, bring her back by day 7. Late returns run
              $15/day, don&apos;t do her like that.
            </p>
          </div>
        </div>
        </Reveal>
      </section>

      {/* Trust / reassurance row */}
      <section className="border-t border-ink/10 bg-white/50 px-6 py-10 sm:py-12">
        <Reveal>
          <TrustBadges />
        </Reveal>
      </section>

      {/* Pricing — pieces are priced individually from retail value; the
          Cleaning & Care Fee is already included in every price. */}
      <section className="border-t border-ink/10 px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-xl text-center">
          <h2 className="font-serif text-4xl italic font-medium">
            Priced piece by piece
          </h2>
          <p className="mx-auto mt-4 text-[15px] leading-relaxed text-ink/65">
            Every piece is priced individually based on its retail value, so you
            pay a fair weekly rate for exactly what you&apos;re borrowing.
          </p>
          <p className="mx-auto mt-5 max-w-md rounded-2xl border border-sage/60 bg-sage/25 px-5 py-3 text-[15px] font-medium text-ink">
            The price you see already has the Cleaning &amp; Care Fee included, so
            there&apos;s nothing extra at checkout. Just wear it and bring it back
            as-is; please don&apos;t clean it yourself, we take care of all
            cleaning.
          </p>
        </Reveal>
      </section>

      {/* Step inside */}
      <section className="border-t border-ink/10 px-6 py-16 sm:py-20">
        <Reveal>
        <div className="mx-auto grid max-w-5xl items-center gap-8 sm:grid-cols-2 lg:gap-12">
          <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="/store/racks.jpg"
              alt="Racks of curated dresses against the Lemon Park wallpaper at the BORROW studio"
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="font-serif text-4xl italic font-medium">Step inside</h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/60 sm:mx-0">
              Our Fayetteville studio is stocked with hand-picked pieces set
              against our Lemon Park wallpaper you&apos;ll want in every photo. Come
              browse in person, or reserve online and pick up when you&apos;re
              ready.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              <a
                href="/dropoff"
                className="rounded-full bg-ink px-5 py-3 text-[14px] text-cream"
              >
                Book a drop-off
              </a>
              <a
                href="https://instagram.com/borrowfayetteville"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-[14px] text-ink/70 transition-colors hover:border-ink/35"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="17"
                  height="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
                </svg>
                @borrowfayetteville
              </a>
            </div>
          </div>
        </div>
        </Reveal>
      </section>

      {/* A look inside — studio gallery (portrait grid). Edit STUDIO_GALLERY above. */}
      {STUDIO_GALLERY.length > 0 && (
        <section className="border-t border-ink/10 bg-white/50 px-6 py-16 sm:py-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
                A look inside
              </p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">
                The studio
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/60">
                Racks sorted by color, hand-picked details, and a fitting room made
                for the try-on.
              </p>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 sm:gap-4">
              {STUDIO_GALLERY.map((photo, i) => (
                <div
                  key={photo.src}
                  className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/20"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    loading="lazy"
                    sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Find us — embedded map (keyless Google Maps embed, no API key needed). */}
      <section className="border-t border-ink/10 bg-white/50 px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-5xl">
          <div className="grid items-center gap-8 sm:grid-cols-2 lg:gap-12">
            <div className="order-2 text-center sm:order-1 sm:text-left">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
                Find us
              </p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">
                Come visit
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/60 sm:mx-0">
                2171 Main Dr, Fayetteville, AR. Browse in person or pick up your
                reservation, we&apos;re right here in Fayetteville.
              </p>
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=2171+Main+Dr,+Fayetteville,+AR"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[14px] text-cream transition-transform hover:scale-[1.03]"
              >
                Get directions →
              </a>
            </div>
            <div className="order-1 space-y-4 sm:order-2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-ink/10">
                <Image
                  src="/store/storefront.jpg"
                  alt="The BORROW storefront entrance in Fayetteville"
                  fill
                  loading="lazy"
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-3xl border border-ink/10">
                <iframe
                  title="Map to the BORROW studio at 2171 Main Dr, Fayetteville, AR"
                  src="https://maps.google.com/maps?q=2171%20Main%20Dr%2C%20Fayetteville%2C%20AR&z=15&output=embed"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="aspect-[4/3] w-full border-0"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Testimonials — ⚠️ PLACEHOLDER quotes (see TESTIMONIALS above). Replace
          with real customer reviews; the section hides itself when the list is
          empty. */}
      {TESTIMONIALS.length > 0 && (
        <section className="border-t border-ink/10 bg-white/50 px-6 py-16 sm:py-20">
          <Reveal className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
                Loved by renters
              </p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">
                What they&apos;re saying
              </h2>
            </div>
            <Testimonials items={TESTIMONIALS} />
            <p className="mt-6 text-center text-[12px] text-ink/40">
              Sample reviews shown to preview the layout, swap in real customer
              quotes when you have them.
            </p>
          </Reveal>
        </section>
      )}

      {/* Follow on Instagram — prominent styled link (no third-party embed). */}
      <section className="border-t border-ink/10 px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl">
          <a
            href="https://instagram.com/borrowfayetteville"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-blush/45 via-lavender/45 to-butter/45 px-6 py-10 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left"
          >
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-cream">
              <svg
                viewBox="0 0 24 24"
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div className="sm:flex-1">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
                Follow along
              </p>
              <p className="mt-1 font-serif text-2xl italic font-medium sm:text-3xl">
                @borrowfayetteville
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                New arrivals, restocks, and pieces styled for every occasion.
              </p>
            </div>
            <span className="inline-block shrink-0 rounded-full bg-ink px-6 py-3 text-[14px] text-cream transition-transform group-hover:scale-[1.03]">
              Follow on Instagram →
            </span>
          </a>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="border-t border-ink/10 bg-white/50 px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="text-center font-serif text-4xl italic font-medium">
            Good to know
          </h2>
          <div className="mt-8 space-y-2.5">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={f.q}
                  className="overflow-hidden rounded-2xl border border-ink/10 bg-cream"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[16px] font-medium"
                  >
                    {f.q}
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 ${
                        open ? "rotate-180" : ""
                      }`}
                    >
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-[14px] leading-relaxed text-ink/60">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>
      </section>

      <SiteFooter />

      <MarketingPopup />
    </main>
  );
}
