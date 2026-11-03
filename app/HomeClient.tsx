"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import MarketingPopup from "@/components/MarketingPopup";
import Reveal from "@/components/Reveal";
import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import HeroMedia, { type HeroSlide } from "@/components/HeroMedia";
import TrustBadges from "@/components/TrustBadges";
import Testimonials, { type Testimonial } from "@/components/Testimonials";
import { PublicItem, itemSlug } from "@/lib/types";

/* ---------------------------------------------------------------------------
   REDESIGN PREVIEW — clean "landing" homepage. Browsing lives on /shop.
   Marketing photography lists mirror the originals; swap paths as you add more.
--------------------------------------------------------------------------- */
const HERO_IMAGES: string[] = [
  "/store/life/hero-1.jpg",
  "/store/life/hero-2.jpg",
  "/store/life/hero-3.jpg",
];
const HERO_VIDEO = "";

const STUDIO_GALLERY: { src: string; alt: string }[] = [
  { src: "/store/life/studio-1.jpg", alt: "The floral fitting room with a gold sconce and mirror" },
  { src: "/store/life/studio-2.jpg", alt: "A rack of beaded gowns against the pink studio wall" },
  { src: "/store/life/studio-3.jpg", alt: "Dresses styled on mannequins against the forest mural" },
  { src: "/store/life/studio-4.jpg", alt: "Browsing the racks at the BORROW studio" },
];

// Real customer reviews only — empty hides the whole "What they're saying"
// section (no fake placeholders live). Drop real quotes here to bring it back.
const TESTIMONIALS: Testimonial[] = [];

const FAQS = [
  { q: "How does sizing work?", a: "Every piece lists its size on the tag and its page, and you can filter the closet by your size. Sizes run true to the brand's own sizing, and we note fit quirks in the piece's description when they matter." },
  { q: "What if it doesn't fit?", a: "Try it on at pickup, and if it isn't right we'll help you find a piece that is. Reservations are paid in full to hold the piece; cancel 48 or more hours before pickup and the rental price is refunded to your card (tax is non-refundable). Within 48 hours of pickup, no-shows, and after pickup are non-refundable." },
  { q: "What's the Cleaning & Care Fee?", a: "It's already included in every rental price, so there's nothing extra to add at checkout. It covers professional cleaning and inspection between wears, so every piece arrives fresh. Please don't clean the piece yourself; just return it as-is and we take care of all cleaning." },
  { q: "What if I return it late?", a: "Pieces are due back by day 7 so the next renter isn't left waiting. Late returns are charged $15 per item per day to the card on file, capped at the piece's replacement value." },
  { q: "How does consignment work?", a: "Bring us the pieces you never reach for; we photograph, list, rent, and clean them, and you earn 20% of every rental, paid straight to your bank. Book a drop-off appointment to get started, and you can retrieve your pieces anytime they aren't rented or reserved." },
];

/* Occasion tiles → deep-link into /shop with the occasion filter pre-applied,
   each fronted by a real lifestyle photo. */
const OCCASION_TILES: { label: string; img: string }[] = [
  { label: "Formal", img: "/store/life/occ-formal.jpg" },
  { label: "Gameday", img: "/store/life/occ-gameday.png" },
  { label: "Date Night", img: "/store/life/occ-datenight.jpg" },
  { label: "Wedding Guest", img: "/store/life/occ-weddingguest.jpg" },
  { label: "Vacation", img: "/store/life/occ-vacation.jpg" },
];

/* The "View all" editorial collage — a tall shot, a wide shot, and two smaller
   ones. Real lifestyle photography, links through to the full closet. */
const VIEW_ALL = {
  tall: "/store/life/view-tall.jpg",
  wide: "/store/life/view-wide.jpg",
  sm1: "/store/life/view-sm1.jpg",
  sm2: "/store/life/view-sm2.jpg",
};

function money(n: number | string): string {
  return `$${Number(n)}`;
}

export default function HomeClient({
  initialHero = null,
}: {
  // Server-provided hero slides (with saved crops) so the cropped hero is in the
  // first paint — no uncropped→crop jump. Null when none are configured.
  initialHero?: HeroSlide[] | null;
}) {
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [reserved, setReserved] = useState<"confirming" | "done" | "error" | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[] | null>(initialHero);
  const [occasionTileImgs, setOccasionTileImgs] = useState<Record<string, string>>({});

  // Hero slides (owner-editable in Settings).
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (Array.isArray(c?.hero) && c.hero.length > 0) setHeroSlides(c.hero as HeroSlide[]);
        if (c?.occasion_tiles && typeof c.occasion_tiles === "object") setOccasionTileImgs(c.occasion_tiles);
      })
      .catch(() => {});
  }, []);

  // Featured pieces — most-loved first (same feed the closet uses).
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/collection");
        if (res.ok) setItems(await res.json());
      } catch {
        /* featured just stays empty */
      }
    })();
  }, []);

  // Returning from Stripe Checkout (?reserved=<session_id>), confirm the reservation.
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("reserved");
    if (!sessionId) return;
    setReserved("confirming");
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

  const featured = (items ?? []).slice(0, 8);

  // Real inventory, rendered high on the page (right under the hero intro) so a
  // phone shopper sees actual pieces without scrolling past the category tiles.
  const featuredSection =
    featured.length > 0 ? (
      <section className="mx-auto max-w-6xl px-5 pb-2 pt-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="kicker">Our picks</p>
            <h2 className="mt-1.5 font-serif text-4xl italic leading-none sm:text-5xl">
              Featured
            </h2>
          </div>
          <Link href="/shop" className="shrink-0 text-[13px] text-ink/55 link-underline hover:text-ink">
            Shop all rentals →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((item) => {
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
                    // Secondary photo fades in on hover. eslint-disable-next-line @next/next/no-img-element
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
                <p className="mt-0.5 text-[14px] text-ink/55">{money(item.rental_price)}</p>
              </Link>
            );
          })}
        </div>
      </section>
    ) : null;

  return (
    <main>
      {reserved && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-6"
          onClick={() => reserved !== "confirming" && setReserved(null)}
        >
          <div className="w-full max-w-sm rounded-3xl bg-cream p-8 text-center" onClick={(e) => e.stopPropagation()}>
            {reserved === "confirming" ? (
              <p className="text-[15px] text-ink/60">Confirming your reservation…</p>
            ) : reserved === "done" ? (
              <>
                <h2 className="font-serif text-4xl italic font-medium">You&apos;re reserved.</h2>
                <p className="mx-auto mt-4 max-w-xs text-[15px] leading-relaxed text-ink/60">
                  Payment received and your piece is held. We&apos;ll email your confirmation and a pickup reminder, and all you have to do is pick it up.
                </p>
                <button onClick={() => setReserved(null)} className="mt-7 rounded-full bg-ink px-8 py-3.5 text-base text-cream">Done</button>
              </>
            ) : (
              <>
                <h2 className="font-serif text-3xl italic font-medium">Hmm, one sec.</h2>
                <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-ink/60">
                  Your payment may have gone through but we couldn&apos;t confirm the reservation here. Please DM @borrowfayetteville on Instagram and we&apos;ll sort it right away.
                </p>
                <button onClick={() => setReserved(null)} className="mt-6 rounded-full border border-ink/15 px-6 py-3 text-[15px] text-ink/60">Close</button>
              </>
            )}
          </div>
        </div>
      )}

      <SiteNav transparent />

      {/* Hero */}
      <section className="relative -mt-[68px]">
        <HeroMedia images={HERO_IMAGES} slides={heroSlides ?? undefined} video={HERO_VIDEO || undefined}>
          {/* Wordmark set into the bottom-right of the hero photo (editorial). */}
          <div className="animate-rise absolute inset-0 z-[2] flex items-end justify-end px-6 pb-9 sm:px-12 sm:pb-12">
            <h1 className="font-serif text-6xl leading-[0.85] tracking-tight text-cream [text-shadow:0_1px_4px_rgba(0,0,0,0.55),0_4px_26px_rgba(0,0,0,0.4)] sm:text-8xl md:text-[8.5rem]">
              BORROW
            </h1>
          </div>
        </HeroMedia>
        {/* Scalloped bottom edge */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-4 bg-cream sm:h-5"
          style={{
            WebkitMaskImage: "radial-gradient(circle at 10px bottom, transparent 10px, black 10.5px)",
            maskImage: "radial-gradient(circle at 10px bottom, transparent 10px, black 10.5px)",
            WebkitMaskRepeat: "repeat-x",
            maskRepeat: "repeat-x",
            WebkitMaskSize: "20px 20px",
            maskSize: "20px 20px",
          }}
        />
      </section>

      {/* Signature brand ticker — a little moving detail, girly but restrained */}
      <section aria-hidden="true" className="overflow-hidden border-b border-blush/30 bg-petal py-3">
        <div className="flex w-max animate-marquee items-center whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, r) => (
            <div key={r} className="flex items-center">
              {["Formals", "Date parties", "Game days", "Weddings", "Graduation", "Vacation"].map(
                (w, i) => (
                  <span key={`${r}-${i}`} className="flex items-center gap-5 px-5 text-ink/70">
                    <span className="font-serif text-xl italic">{w}</span>
                    <span className="text-blush-deep">·</span>
                  </span>
                )
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Intro line */}
      <section className="px-6 pb-4 pt-10 text-center">
        <p className="mx-auto max-w-md text-[17px] leading-relaxed text-ink/65">
          A curated closet for formals, date parties, wedding guests, game days, and more, yours for the week.
        </p>
        <div className="mx-auto mt-5 flex max-w-md items-center justify-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink/45">
          <span>Find your outfit</span>
          <span className="text-blush-deep">·</span>
          <span>Book your week</span>
          <span className="text-blush-deep">·</span>
          <span>Return by day 7</span>
        </div>
      </section>

      {/* Featured pieces — real inventory near the top */}
      {featuredSection}

      {/* View all — editorial lifestyle collage (tall + wide + two small) */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="mb-6 text-center">
          <Link
            href="/shop"
            className="font-serif text-3xl italic font-medium link-underline hover:text-ink sm:text-4xl"
          >
            View all →
          </Link>
        </div>
        <Link href="/shop" className="group grid gap-3 sm:grid-cols-2 sm:gap-4">
          {/* Tall shot */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/30 sm:aspect-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={VIEW_ALL.tall} alt="Styled at the BORROW studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
          </div>
          {/* Right column: wide shot over two smaller ones */}
          <div className="grid gap-3 sm:gap-4">
            <div className="relative aspect-[16/11] overflow-hidden rounded-2xl bg-lavender/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={VIEW_ALL.wide} alt="Out in the wild in BORROW" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-lavender/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={VIEW_ALL.sm1} alt="Dressed for the day in BORROW" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-lavender/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={VIEW_ALL.sm2} alt="Girls' night in BORROW" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Shop by Occasion — real lifestyle photo tiles */}
      <section className="mx-auto max-w-6xl px-5 pb-12">
        <h2 className="mb-6 font-serif text-3xl italic font-medium">Shop by Occasion</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {OCCASION_TILES.map((t) => {
            const img = occasionTileImgs[t.label] || t.img;
            return (
              <Link
                key={t.label}
                href={`/shop?occasion=${encodeURIComponent(t.label)}`}
                className="group text-center"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={t.label} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <span className="mt-2.5 block text-[13px] font-medium uppercase tracking-[0.14em] text-ink/75">
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Lookbook — editorial feature */}
      <section className="px-5 py-10">
        <Reveal className="mx-auto max-w-6xl">
          <div className="grid overflow-hidden rounded-3xl sm:grid-cols-2">
            <div className="relative aspect-[4/5] sm:aspect-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/store/life/lookbook.jpg" alt="The BORROW girls at the studio" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
            </div>
            <div className="flex flex-col justify-center bg-petal px-8 py-14 text-center sm:px-12 sm:text-left">
              <p className="kicker">The Lookbook</p>
              <h2 className="mt-2 font-serif text-4xl italic font-medium leading-tight sm:text-5xl">
                Styled by us, worn by you
              </h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/65 sm:mx-0">
                Every piece in the closet, styled and ready to rent. Browse the full
                collection and find the one for your next occasion.
              </p>
              <Link
                href="/lookbook"
                className="mx-auto mt-6 inline-block w-max rounded-full bg-ink px-7 py-3.5 text-[14px] font-medium text-cream transition-transform hover:scale-[1.03] sm:mx-0"
              >
                Explore the lookbook →
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Consign / drop-off call-out */}
      <section className="px-5 py-10">
        <Reveal className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-sage/35 px-6 py-8 text-center sm:flex-row sm:justify-between sm:gap-8 sm:px-10 sm:text-left">
            <div>
              <p className="kicker text-sage-deep">Consign with Borrow</p>
              <h2 className="mt-1.5 font-serif text-2xl italic font-medium sm:text-3xl">Have pieces to drop off?</h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink/65">
                Bring in the dresses you&apos;re done with, and you earn 20% every time one rents. Book a quick appointment and we&apos;ll handle the rest.
              </p>
            </div>
            <a href="/dropoff" className="inline-block w-full shrink-0 rounded-full bg-ink px-8 py-4 text-center text-[15px] font-medium text-cream transition-transform hover:scale-[1.03] sm:w-auto">
              Rent out your clothes →
            </a>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="border-t border-blush/20 bg-petal px-6 py-16 sm:py-20">
        <Reveal>
          <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="font-serif text-3xl italic text-blush-deep">1</p>
              <h3 className="mt-1 text-xl font-medium">Pick your favorite</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">Browse the closet by event or size. Every piece is cleaned and inspected between wears.</p>
            </div>
            <div>
              <p className="font-serif text-3xl italic text-blush-deep">2</p>
              <h3 className="mt-1 text-xl font-medium">Book your week</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">Pay in full to reserve your piece, then it&rsquo;s yours for 7 days from your pickup day.</p>
            </div>
            <div>
              <p className="font-serif text-3xl italic text-blush-deep">3</p>
              <h3 className="mt-1 text-xl font-medium">Wear &amp; return</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/55">Live your night, bring her back by day 7. Late returns run $15/day, don&apos;t do her like that.</p>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Trust / reassurance row */}
      <section className="border-t border-ink/10 bg-cloud px-6 py-10 sm:py-12">
        <Reveal>
          <TrustBadges />
        </Reveal>
      </section>

      {/* Studio gallery */}
      {STUDIO_GALLERY.length > 0 && (
        <section className="border-t border-lavender/50 bg-mist px-6 py-16 sm:py-20">
          <Reveal className="mx-auto max-w-6xl">
            <div className="text-center">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">A look inside</p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">The studio</h2>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {STUDIO_GALLERY.map((photo) => (
                <div key={photo.src} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/20">
                  <Image src={photo.src} alt={photo.alt} fill loading="lazy" sizes="(min-width: 640px) 25vw, 50vw" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                </div>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* Find us / Store Hours & Location (anchor: #visit) */}
      <section id="visit" className="scroll-mt-20 border-t border-blush/20 bg-petal px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-5xl">
          <div className="grid items-center gap-8 sm:grid-cols-2 lg:gap-12">
            <div className="order-2 text-center sm:order-1 sm:text-left">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">Store Hours &amp; Location</p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">Come visit</h2>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/60 sm:mx-0">
                2171 Main Dr, Fayetteville, AR. Browse in person or pick up your reservation, we&apos;re right here in Fayetteville.
              </p>
              <a href="https://www.google.com/maps/dir/?api=1&destination=2171+Main+Dr,+Fayetteville,+AR" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[14px] text-cream transition-transform hover:scale-[1.03]">
                Get directions →
              </a>
            </div>
            <div className="order-1 space-y-4 sm:order-2">
              <div className="relative aspect-[3/2] overflow-hidden rounded-3xl border border-ink/10">
                <Image src="/store/storefront.jpg" alt="The BORROW storefront entrance in Fayetteville" fill loading="lazy" sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" />
              </div>
              <div className="overflow-hidden rounded-3xl border border-ink/10">
                <iframe title="Map to the BORROW studio at 2171 Main Dr, Fayetteville, AR" src="https://maps.google.com/maps?q=2171%20Main%20Dr%2C%20Fayetteville%2C%20AR&z=15&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[4/3] w-full border-0" allowFullScreen />
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Testimonials */}
      {TESTIMONIALS.length > 0 && (
        <section className="border-t border-ink/10 bg-cloud px-6 py-16 sm:py-20">
          <Reveal className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">Loved by renters</p>
              <h2 className="mt-1.5 font-serif text-4xl italic font-medium">What they&apos;re saying</h2>
            </div>
            <Testimonials items={TESTIMONIALS} />
            <p className="mt-6 text-center text-[12px] text-ink/40">Sample reviews shown to preview the layout, swap in real customer quotes when you have them.</p>
          </Reveal>
        </section>
      )}

      {/* Instagram */}
      <section className="border-t border-ink/10 px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl">
          <a href="https://instagram.com/borrowfayetteville" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-5 rounded-3xl bg-butter/55 px-6 py-10 text-center sm:flex-row sm:justify-center sm:gap-6 sm:text-left">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-ink text-cream">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
              </svg>
            </span>
            <div className="sm:flex-1">
              <p className="text-[12px] uppercase tracking-[0.2em] text-blush-deep">Follow along</p>
              <p className="mt-1 font-serif text-2xl italic font-medium sm:text-3xl">@borrowfayetteville</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">New arrivals, restocks, and pieces styled for every occasion.</p>
            </div>
            <span className="inline-block shrink-0 rounded-full bg-ink px-6 py-3 text-[14px] text-cream transition-transform group-hover:scale-[1.03]">Follow on Instagram →</span>
          </a>
        </Reveal>
      </section>

      {/* FAQ (anchor: #faq) */}
      <section id="faq" className="scroll-mt-20 border-t border-lavender/50 bg-mist px-6 py-16 sm:py-20">
        <Reveal className="mx-auto max-w-2xl">
          <h2 className="text-center font-serif text-4xl italic font-medium">Good to know</h2>
          <div className="mt-8 space-y-2.5">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q} className="overflow-hidden rounded-2xl border border-ink/10 bg-cream">
                  <button type="button" onClick={() => setOpenFaq(open ? null : i)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[16px] font-medium">
                    {f.q}
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" className={`h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 ${open ? "rotate-180" : ""}`}>
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-4 text-[14px] leading-relaxed text-ink/60">{f.a}</p>
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
