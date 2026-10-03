import Link from "next/link";

/**
 * Route-level skeleton for a piece's page. Mirrors the product layout (header
 * shell + 3:4 photo block beside title/price/booking-form lines) so tapping a
 * card shows an instant, on-brand placeholder instead of a blank flash. All
 * blocks reserve their final space, so nothing reflows when the page swaps in.
 */
export default function Loading() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      {/* Same top bar as the product page, so the shell doesn't jump */}
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
        <span className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream">
          Account
        </span>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pb-1">
        <div className="h-11 w-full animate-pulse rounded-full bg-ink/5" />
      </div>

      <div className="px-4 pb-16 pt-2 sm:px-6">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Photo block — fixed 3:4 frame, matches PhotoCarousel container */}
          <div className="w-full">
            <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-lavender/40" />
          </div>

          {/* Details + booking form lines */}
          <div className="w-full min-w-0 animate-pulse space-y-4">
            <div className="h-9 w-2/3 rounded-lg bg-ink/5" />
            <div className="h-4 w-1/2 rounded bg-ink/5" />
            <div className="h-4 w-1/3 rounded bg-ink/5" />
            <div className="mt-6 space-y-4">
              <div className="h-12 w-full rounded-xl bg-ink/5" />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="h-12 w-full rounded-xl bg-ink/5" />
                <div className="h-12 w-full rounded-xl bg-ink/5" />
                <div className="h-12 w-full rounded-xl bg-ink/5 sm:col-span-2" />
              </div>
              <div className="h-20 w-full rounded-xl bg-ink/5" />
              <div className="h-14 w-full rounded-full bg-ink/10" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
