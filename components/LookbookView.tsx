"use client";

import Link from "next/link";
import PhotoCarousel from "@/components/PhotoCarousel";
import { PublicItem, itemSlug, availabilityOf, fmtShort, todayISO } from "@/lib/types";

function money(n: number | string): string {
  const v = Math.round(Number(n) * 100) / 100;
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

/** Tinted status box per availability tone. */
const TONE_BOX: Record<string, string> = {
  available: "border-sage/60 bg-sage/25",
  out: "border-ink/15 bg-ink/[0.04]",
  soon: "border-butter bg-butter/40",
  hold: "border-lavender bg-lavender/40",
};

/**
 * Read-only piece view for the Lookbook. Same look as the shop's product page
 * but with NO booking form — the Lookbook never reserves anything. If the piece
 * is a live closet piece it links back to the bookable page; otherwise it just
 * shows why it isn't available right now.
 */
export default function LookbookView({ item }: { item: PublicItem }) {
  const photos = item.photos?.length
    ? item.photos
    : item.photo_url
      ? [item.photo_url]
      : [];

  const avail = availabilityOf(item);

  // Upcoming booked weeks (only meaningful for live closet pieces).
  const upcoming = item.booked
    .filter((b) => b.due_date.slice(0, 10) >= todayISO())
    .slice(0, 4);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:gap-10">
      {/* Photos */}
      <div className="w-full lg:sticky lg:top-6 lg:self-start">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-lavender/40">
          <PhotoCarousel photos={photos} alt={`${item.brand} dress`} />
        </div>
      </div>

      {/* Details (view only) */}
      <div className="w-full min-w-0">
        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
          {item.brand}
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Size {item.size}
          {item.color ? ` · ${item.color}` : ""} ·{" "}
          <span className="font-semibold text-ink">
            {money(item.rental_price)} for the week
          </span>{" "}
          <span className="text-ink/45">· Cleaning &amp; Care Fee already included</span>
        </p>
        {item.retail_value != null && Number(item.retail_value) > 0 && (
          <p className="mt-1 text-[15px] font-medium text-ink/55">
            Retails for {money(item.retail_value)}
          </p>
        )}
        {item.event_types.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {item.event_types.map((ev) => (
              <span
                key={ev}
                className="rounded-full bg-lavender/60 px-2.5 py-0.5 text-[11px]"
              >
                {ev}
              </span>
            ))}
          </div>
        )}

        {item.description && (
          <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-ink/70">
            {item.description}
          </p>
        )}

        {/* Availability status — replaces the booking form */}
        <div
          className={`mt-6 rounded-2xl border px-4 py-4 ${TONE_BOX[avail.tone] ?? TONE_BOX.out}`}
        >
          <p className="text-[11px] uppercase tracking-[0.18em] text-ink/50">
            Availability
          </p>
          <p className="mt-1 text-[17px] font-medium">{avail.label}</p>
          <p className="mt-1 text-[14px] leading-relaxed text-ink/65">
            {avail.detail}
          </p>
          {upcoming.length > 0 && avail.reservable && (
            <p className="mt-2 text-[12px] text-ink/45">
              Already reserved:{" "}
              {upcoming
                .map((b) => `${fmtShort(b.start_date)}–${fmtShort(b.due_date)}`)
                .join(", ")}
            </p>
          )}
        </div>

        {avail.reservable ? (
          <Link
            href={`/shop/${itemSlug(item)}`}
            className="mt-4 block w-full rounded-full bg-ink px-6 py-4 text-center text-base text-cream transition-transform hover:scale-[1.02]"
          >
            Reserve it in the closet →
          </Link>
        ) : (
          <p className="mt-4 rounded-full border border-ink/15 bg-white px-6 py-4 text-center text-[14px] text-ink/55">
            Not available to reserve right now — this is a look-only view.
          </p>
        )}

        <p className="mt-3 text-center text-[13px] text-ink/45">
          Have your eye on this one?{" "}
          <a
            href="https://instagram.com/borrowfayetteville"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-ink"
          >
            DM @borrowfayetteville
          </a>{" "}
          and we&apos;ll let you know when it&apos;s free.
        </p>
      </div>
    </div>
  );
}
