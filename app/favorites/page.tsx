"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PhotoCarousel from "@/components/PhotoCarousel";
import HeartButton from "@/components/HeartButton";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { PublicItem, itemSlug } from "@/lib/types";
import { useFavorites } from "@/lib/favorites";

function money(n: number | string): string {
  return `$${Number(n)}`;
}

/**
 * The shopper's saved pieces. Favorites are kept on this device (see
 * lib/favorites), so no login is needed. We load the live collection and show
 * the saved pieces in their saved order (newest first). Pieces that are no
 * longer in the closet simply drop off the list.
 */
export default function Favorites() {
  const { ids, count } = useFavorites();
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collection");
        if (!res.ok) throw new Error();
        setItems(await res.json());
      } catch {
        setError("Your closet didn't load, refresh to try again.");
      }
    })();
  }, []);

  // Saved pieces in saved order; anything no longer available falls away.
  const saved = useMemo(() => {
    if (!items) return [];
    const byId = new Map(items.map((i) => [i.id, i]));
    return ids.map((id) => byId.get(id)).filter((i): i is PublicItem => !!i);
  }, [items, ids]);

  // Some saved ids may point at pieces that are gone (rented out / removed).
  const missing = items ? ids.length - saved.length : 0;

  return (
    <main>
      <SiteNav />

      <section className="mx-auto max-w-5xl px-5 pt-8 pb-1 text-center">
        <h1 className="font-serif text-4xl italic font-medium sm:text-5xl">Your favorites</h1>
        <p className="mt-1.5 text-[14px] text-ink/55">
          The pieces you&apos;ve hearted, saved on this device so you can come back to them.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-8">
        {error ? (
          <p className="py-20 text-center text-ink/50">{error}</p>
        ) : count === 0 ? (
          <div className="animate-rise py-20 text-center">
            <p className="font-serif text-3xl italic text-ink/40">No favorites yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink/45">
              Tap the heart on any piece to save it here, then find it again when you&apos;re
              ready to book.
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-[15px] text-cream transition-transform hover:scale-[1.03]"
            >
              Browse the closet
            </Link>
          </div>
        ) : items === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/5" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {saved.map((item, idx) => {
                const cardPhotos = item.photos?.length
                  ? item.photos
                  : item.photo_url
                    ? [item.photo_url]
                    : [];
                const href = `/shop/${itemSlug(item)}`;
                return (
                  <div
                    key={item.id}
                    className="animate-rise group relative text-left"
                    style={{ animationDelay: `${Math.min(idx, 8) * 35}ms` }}
                  >
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
                      <HeartButton itemId={item.id} className="absolute right-2 top-2 z-20" />
                    </div>
                    <Link href={href} className="block w-full px-1 pt-2.5 text-left">
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
            {missing > 0 && (
              <p className="mt-8 text-center text-[13px] text-ink/45">
                {missing} saved {missing === 1 ? "piece is" : "pieces are"} no longer available
                and {missing === 1 ? "isn't" : "aren't"} shown.
              </p>
            )}
          </>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
