import Image from "next/image";

export type LifestylePhoto = { src: string; label?: string; alt?: string };

/**
 * "Seen in Borrow" — lifestyle photos of pieces actually being worn (formals,
 * gameday, date night). Populate the `photos` array as real shots come in; until
 * then it shows a tasteful editorial placeholder mosaic in the brand palette so
 * the section still looks intentional. Real photos are lazy-loaded and served
 * responsively via next/image.
 */

// Soft brand-color placeholder tiles — read as an intentional mosaic when empty.
const PLACEHOLDERS: { label: string; bg: string; fg: string }[] = [
  { label: "Formals", bg: "bg-blush/45", fg: "text-blush-deep" },
  { label: "Gameday", bg: "bg-sage/35", fg: "text-sage-deep" },
  { label: "Date night", bg: "bg-lavender/60", fg: "text-ink/55" },
  { label: "Weddings", bg: "bg-butter/60", fg: "text-ink/55" },
  { label: "Parties", bg: "bg-blush/30", fg: "text-blush-deep" },
];

export default function LifestyleGallery({
  photos,
}: {
  photos: LifestylePhoto[];
}) {
  if (photos.length === 0) {
    return (
      <div className="mt-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PLACEHOLDERS.map((p) => (
            <div
              key={p.label}
              className={`relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl ${p.bg}`}
            >
              <div className="text-center">
                <p className={`font-serif text-2xl italic ${p.fg}`}>{p.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-ink/35">
                  Coming soon
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[13px] text-ink/45">
          Wore a Borrow piece out?{" "}
          <a
            href="https://instagram.com/borrowfayetteville"
            className="text-blush-deep underline underline-offset-2 hover:text-ink"
          >
            Tag @borrowfayetteville
          </a>{" "}
          to be featured here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <div
          key={`${p.src}-${i}`}
          className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/40"
        >
          <Image
            src={p.src}
            alt={p.alt || p.label || "A Borrow piece worn out"}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {p.label && (
            <>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
              <span className="absolute bottom-2.5 left-3 text-[13px] font-medium text-cream drop-shadow-sm">
                {p.label}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
