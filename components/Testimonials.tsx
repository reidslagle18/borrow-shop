export type Testimonial = {
  name: string;
  quote: string;
  stars?: number; // 1–5, optional
  detail?: string; // optional, e.g. "U of A '25"
};

function Stars({ n }: { n: number }) {
  const count = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          className={i < count ? "text-sage-deep" : "text-ink/15"}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18.9 6.1 21.5l1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * Customer testimonials in a simple card grid. Populate the `items` array with
 * real quotes as you collect them; the placeholder examples show the layout.
 */
export default function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => (
        <figure
          key={`${t.name}-${i}`}
          className="flex h-full flex-col rounded-3xl bg-white p-6 shadow-sm"
        >
          {t.stars ? <Stars n={t.stars} /> : null}
          <blockquote className="mt-3 flex-1 font-serif text-[17px] italic leading-relaxed text-ink/80">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-[13px] text-ink/55">
            <span className="font-medium text-ink/75">{t.name}</span>
            {t.detail ? <span> · {t.detail}</span> : null}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
