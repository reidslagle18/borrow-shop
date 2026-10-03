import type { Metadata } from "next";
import Link from "next/link";
import ProductView from "@/components/ProductView";
import SiteFooter from "@/components/SiteFooter";
import { PublicItem, itemSlug } from "@/lib/types";

/** Fetch the full availability feed once (Next de-dupes within a request). */
async function getList(): Promise<PublicItem[]> {
  const base = process.env.ADMIN_API_BASE;
  if (!base) return [];
  try {
    const res = await fetch(`${base}/api/public/availability`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicItem[];
  } catch {
    return [];
  }
}

async function getItem(slug: string): Promise<PublicItem | null> {
  const items = await getList();
  return items.find((i) => itemSlug(i) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) return { title: "Piece · BORROW" };

  const img = item.photos?.[0] || item.photo_url || undefined;
  const title = `${item.brand} · BORROW`;
  const bits = [
    `Size ${item.size}`,
    item.color || null,
    `$${Number(item.rental_price)} for the week`,
  ].filter(Boolean);
  const description = `${item.brand} · ${bits.join(" · ")}. Rent it for the week at BORROW.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: img ? [{ url: img }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: img ? [img] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const items = await getList();
  const item = items.find((i) => itemSlug(i) === slug) ?? null;

  // Other pieces that make up the same matching set (top + skirt, etc.).
  const mates =
    item && item.set_group
      ? items.filter(
          (i) => i.id !== item.id && !!i.set_group && i.set_group === item.set_group
        )
      : [];

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

      {/* Search (routes to the closet's live results) */}
      <form action="/" className="mx-auto w-full max-w-5xl px-5 pb-1">
        <input
          type="search"
          name="q"
          placeholder="Search the closet"
          aria-label="Search the closet"
          className="w-full rounded-full border border-ink/15 bg-white px-5 py-2.5 text-[15px] outline-none focus:border-ink/40"
        />
      </form>

      <div className="px-4 pb-16 pt-2 sm:px-6">
        {item ? (
          <>
            <ProductView item={item} />

            {mates.length > 0 && (
              <section className="mx-auto mt-12 w-full max-w-5xl border-t border-ink/10 pt-8">
                <h2 className="font-serif text-2xl italic font-medium">
                  Complete the set
                </h2>
                <p className="mt-1 text-[14px] text-ink/55">
                  This piece is part of a matching set. Reserve the other
                  {mates.length === 1 ? " piece" : " pieces"} too.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {mates.map((m) => {
                    const cover = m.photos?.[0] || m.photo_url || null;
                    return (
                      <Link
                        key={m.id}
                        href={`/shop/${itemSlug(m)}`}
                        className="group text-left"
                      >
                        <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-lavender/40">
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={cover}
                              alt={`${m.brand} dress`}
                              className="h-full w-full object-cover"
                            />
                          )}
                          <span className="pointer-events-none absolute bottom-2.5 right-2.5 rounded-full bg-cream/95 px-3 py-1 text-[13px] font-medium">
                            ${Number(m.rental_price)}
                          </span>
                        </div>
                        <p className="mt-2 truncate font-serif text-lg font-semibold leading-tight">
                          {m.brand}
                        </p>
                        <p className="text-[13px] text-ink/50">Size {m.size}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          <div className="py-24 text-center">
            <p className="font-serif text-3xl italic text-ink/40">
              This piece isn&apos;t available
            </p>
            <p className="mt-2 text-sm text-ink/50">
              It may have been rented or taken down.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-ink px-6 py-3 text-[15px] text-cream"
            >
              Back to the closet
            </Link>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
