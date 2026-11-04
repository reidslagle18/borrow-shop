"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicItem, itemSlug } from "@/lib/types";

/* A live row of real rental pieces, pulled from the same feed the shop uses.
   "Featured" follows the owner-starred Featured list (by rank); "Most loved"
   shows the default collection order. Data is live, styling is locked. */
export default function ProductRow({
  kicker = "Our picks",
  heading = "Featured",
  source = "Featured",
  count = 4,
  linkLabel = "Shop all rentals →",
  linkHref = "/shop",
}: {
  kicker?: string;
  heading?: string;
  source?: "Featured" | "Most loved";
  count?: number;
  linkLabel?: string;
  linkHref?: string;
}) {
  const [items, setItems] = useState<PublicItem[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/collection");
        if (r.ok) setItems(await r.json());
      } catch {
        /* leave empty — the section hides itself */
      }
    })();
  }, []);

  const list = (items ?? [])
    .filter((i) => (source === "Featured" ? i.featured : true))
    .sort((a, b) =>
      source === "Featured"
        ? (a.featured_rank ?? Number.MAX_SAFE_INTEGER) - (b.featured_rank ?? Number.MAX_SAFE_INTEGER)
        : 0
    )
    .slice(0, Math.max(1, Math.min(count, 12)));

  if (list.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-5 flex items-end justify-between">
        <div>
          {kicker && <p className="kicker">{kicker}</p>}
          {heading && (
            <h2 className="mt-1.5 font-serif text-4xl italic leading-none sm:text-5xl">{heading}</h2>
          )}
        </div>
        {linkLabel && linkHref && (
          <Link href={linkHref} className="shrink-0 text-[13px] text-ink/55 link-underline hover:text-ink">
            {linkLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((item) => {
          const cover = item.photos?.[0] || item.photo_url || null;
          const second = item.photos?.[1] || null;
          return (
            <Link key={item.id} href={`/shop/${itemSlug(item)}`} className="group text-left">
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/40">
                {cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cover}
                    alt={`${item.brand} dress`}
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-cover transition-opacity duration-500 ${
                      second ? "group-hover:opacity-0" : "transition-transform group-hover:scale-[1.03]"
                    }`}
                  />
                )}
                {second && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={second}
                    alt={`${item.brand} — alternate view`}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                )}
              </div>
              <p className="mt-2.5 truncate font-serif text-lg font-semibold leading-tight">{item.brand}</p>
              <p className="mt-0.5 text-[14px] text-ink/55">${Number(item.rental_price)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
