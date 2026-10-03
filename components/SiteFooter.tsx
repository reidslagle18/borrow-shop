import Link from "next/link";

/**
 * Shared site footer: brand mark, legal links, and store info. Small and
 * understated, present on every page.
 */
export default function SiteFooter({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <footer className="mt-16 border-t border-ink/10 px-6 pb-8 pt-8 text-center">
      {showBrand && (
        <>
          <p className="font-serif text-2xl italic font-medium">BORROW</p>
          <p className="mt-1 text-[12px] uppercase tracking-[0.25em] text-ink/40">
            Rent your outfit · Save the stress
          </p>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[13px] text-ink/55">
        <Link href="/shop" className="underline-offset-2 hover:underline">
          The closet
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/lookbook" className="underline-offset-2 hover:underline">
          Full collection
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/account" className="underline-offset-2 hover:underline">
          My account
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/size-guide" className="underline-offset-2 hover:underline">
          Size guide
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/portal" className="underline-offset-2 hover:underline">
          Consignor Studio
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/dropoff" className="underline-offset-2 hover:underline">
          Book a drop-off
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[12px] text-ink/45">
        <Link href="/privacy" className="underline-offset-2 hover:underline">
          Privacy Policy
        </Link>
        <span className="text-ink/25">·</span>
        <Link href="/terms" className="underline-offset-2 hover:underline">
          Terms
        </Link>
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-ink/40">
        BORROW LLC · 2171 Main Dr, Fayetteville, AR
        <br />
        Questions? DM{" "}
        <a
          href="https://instagram.com/borrowfayetteville"
          className="underline underline-offset-2"
        >
          @borrowfayetteville
        </a>{" "}
        on Instagram
      </p>
    </footer>
  );
}
