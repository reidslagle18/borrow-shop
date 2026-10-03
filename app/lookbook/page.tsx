"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MultiSelect from "@/components/MultiSelect";
import PhotoCarousel from "@/components/PhotoCarousel";
import SiteFooter from "@/components/SiteFooter";
import {
  PublicItem,
  EVENT_TYPES,
  SIZES,
  itemSlug,
  availabilityOf,
  type Availability,
} from "@/lib/types";

/* The view-only "full collection" (Lookbook). Same browsing tools as the
   closet, but it shows EVERYTHING — available, rented, being cleaned, on hold,
   archived — and nothing here can be reserved. Available pieces link back to
   the bookable closet; unavailable ones are purely to look at. */

function itemColors(i: PublicItem): string[] {
  return (i.color || "").split(",").map((c) => c.trim()).filter(Boolean);
}
function itemSilhouettes(i: PublicItem): string[] {
  return (i.silhouette || "").split(",").map((s) => s.trim()).filter(Boolean);
}

type Category = { label: string; sils: string[]; subs?: { label: string; sil: string }[] };
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

function stem(w: string): string {
  if (w.length <= 3) return w;
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

/** Badge styling per availability tone. */
const BADGE: Record<Availability["tone"], string> = {
  available: "bg-sage/80 text-ink",
  out: "bg-ink/70 text-cream",
  soon: "bg-butter text-ink",
  hold: "bg-lavender text-ink",
};

function money(n: number | string): string {
  return `$${Number(n)}`;
}

export default function Lookbook() {
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState("");
  const [fSizes, setFSizes] = useState<string[]>([]);
  const [fColors, setFColors] = useState<string[]>([]);
  const [fEvents, setFEvents] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [sort, setSort] = useState("featured");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [colorSwatches, setColorSwatches] = useState<Record<string, string>>({});
  const router = useRouter();

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c?.color_swatches && typeof c.color_swatches === "object") {
          setColorSwatches(c.color_swatches);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/catalog");
        if (!res.ok) throw new Error();
        setItems(await res.json());
      } catch {
        setError("The collection didn't load, refresh to try again.");
      }
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
    const silFilter = sub ? [sub] : activeCat ? activeCat.sils : [];
    if (silFilter.length)
      l = l.filter((i) => itemSilhouettes(i).some((s) => silFilter.includes(s)));
    if (fSizes.length) l = l.filter((i) => fSizes.includes(i.size));
    if (fColors.length)
      l = l.filter((i) => itemColors(i).some((c) => fColors.includes(c)));
    if (fEvents.length)
      l = l.filter((i) => (i.event_types || []).some((e) => fEvents.includes(e)));
    if (onlyAvailable)
      l = l.filter((i) => availabilityOf(i).label === "Available now");
    if (sort === "price-asc")
      l = [...l].sort((a, b) => Number(a.rental_price) - Number(b.rental_price));
    else if (sort === "price-desc")
      l = [...l].sort((a, b) => Number(b.rental_price) - Number(a.rental_price));
    return l;
  }, [items, query, category, sub, activeCat, fSizes, fColors, fEvents, sort, onlyAvailable]);

  function reset() {
    setCategory(null);
    setSub(null);
    setFSizes([]);
    setFColors([]);
    setFEvents([]);
    setQuery("");
    setOnlyAvailable(false);
  }

  const anyFilter =
    !!query.trim() ||
    !!category ||
    !!sub ||
    fSizes.length > 0 ||
    fColors.length > 0 ||
    fEvents.length > 0 ||
    onlyAvailable;

  const filterKey = [
    query.trim(),
    category ?? "",
    sub ?? "",
    sort,
    onlyAvailable ? "avail" : "",
    fSizes.join("|"),
    fColors.join("|"),
    fEvents.join("|"),
  ].join("~");

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <Link
          href="/"
          className="rounded-full border border-ink/15 bg-white px-4 py-2 text-[13px] text-ink/70 transition-colors hover:border-ink/35"
        >
          ← The closet
        </Link>
        <Link href="/" className="font-serif text-2xl italic font-medium">
          BORROW
        </Link>
        <Link
          href="/account"
          className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream"
        >
          Account
        </Link>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-3xl px-5 pb-6 pt-2 text-center">
        <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">
          Browse only
        </p>
        <h1 className="mt-1.5 font-serif text-4xl italic font-medium sm:text-5xl">
          The full collection
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink/65">
          Every piece we carry, whether it&apos;s available this second or not.
          This is a look-only gallery, so nothing here can be reserved. When a
          piece is free, you&apos;ll see a link to book it back in the closet.
        </p>
      </section>

      {/* Search + Shop by categories */}
      <section className="mx-auto w-full max-w-5xl px-5">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by brand, color, description, or item ID"
            aria-label="Search the collection"
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
            Browse by:
          </span>
          <button
            onClick={() => {
              setCategory(null);
              setSub(null);
            }}
            className={pillCls(!category)}
          >
            Everything
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
      </section>

      {/* Filters + sort */}
      <section className="sticky top-0 z-30 mt-3 border-y border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <MultiSelect label="Event" options={eventOptions} selected={fEvents} onChange={setFEvents} />
          <MultiSelect label="Size" options={sizeOptions} selected={fSizes} onChange={setFSizes} />
          <MultiSelect label="Color" options={colorOptions} selected={fColors} onChange={setFColors} swatches={colorSwatches} />
          <button
            onClick={() => setOnlyAvailable((v) => !v)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              onlyAvailable
                ? "border-sage-deep bg-sage/60 text-ink"
                : "border-ink/15 bg-white text-ink/70 hover:border-ink/35"
            }`}
          >
            Available now
          </button>
          {anyFilter ? (
            <button
              onClick={reset}
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
              Gathering the whole collection…
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/5" />
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="animate-rise py-20 text-center">
            <p className="font-serif text-3xl italic text-ink/40">
              {items.length === 0
                ? "The collection is being stocked"
                : "Nothing matches those filters"}
            </p>
            {items.length > 0 && (
              <button
                onClick={reset}
                className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-[15px] text-cream transition-transform hover:scale-[1.03]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-[13px] text-ink/45">
              {list.length} {list.length === 1 ? "piece" : "pieces"}
            </p>
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
                const avail = availabilityOf(item);
                const dimmed = avail.tone !== "available";
                const href = `/lookbook/${itemSlug(item)}`;
                return (
                  <div
                    key={item.id}
                    className="animate-rise group text-left"
                    style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/40">
                      <div className={dimmed ? "h-full w-full opacity-[0.82]" : "h-full w-full"}>
                        <PhotoCarousel
                          photos={cardPhotos}
                          alt={`${item.brand} dress`}
                          onTap={() => router.push(href)}
                          arrowsOnHover
                          hoverPeek
                          overlay={
                            <>
                              <span
                                className={`pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-full px-2.5 py-1 text-[11px] font-medium ${BADGE[avail.tone]}`}
                              >
                                {avail.label}
                              </span>
                              <span className="pointer-events-none absolute bottom-2.5 right-2.5 z-10 rounded-full bg-cream/95 px-3 py-1 text-[13px] font-medium">
                                {money(item.rental_price)}
                              </span>
                            </>
                          }
                        />
                      </div>
                    </div>
                    <Link href={href} className="block w-full px-1 pt-2.5 text-left">
                      <p className="truncate font-serif text-lg font-semibold leading-tight">
                        {item.brand}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink/50">
                        Size {item.size}
                        {item.color ? ` · ${item.color}` : ""}
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
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
