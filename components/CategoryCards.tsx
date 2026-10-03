import Image from "next/image";

export type CategoryCard = {
  label: string;
  tone: string; // Tailwind bg-* class for the placeholder tile
  img?: string; // real photo (optional) — falls back to the tone tile
};

/**
 * Editorial "shop by category" cards for the homepage. Each maps to a top-level
 * category and, when clicked, filters the closet to it. Supply a photo per
 * category via `img` (drop files in /public/categories); until then a tasteful
 * brand-color tile with the category name shows.
 */
export default function CategoryCards({
  categories,
  onPick,
}: {
  categories: CategoryCard[];
  onPick: (label: string) => void;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <button
          key={c.label}
          type="button"
          onClick={() => onPick(c.label)}
          aria-label={`Shop ${c.label}`}
          className={`group relative flex aspect-[4/5] items-end overflow-hidden rounded-2xl ${
            c.img ? "bg-lavender/40" : c.tone
          }`}
        >
          {c.img && (
            <Image
              src={c.img}
              alt={c.label}
              fill
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          )}
          {/* Gradient only needed to keep the label legible over a photo. */}
          {c.img && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
          )}
          <span
            className={`relative z-10 w-full px-3 pb-3 text-left font-serif text-xl italic font-medium ${
              c.img ? "text-cream drop-shadow-sm" : "text-ink/75"
            }`}
          >
            {c.label}
          </span>
          {!c.img && (
            <span className="absolute right-3 top-3 text-[11px] uppercase tracking-[0.15em] text-ink/35">
              Shop
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
