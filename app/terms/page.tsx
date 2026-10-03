import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms · BORROW",
  description: "The terms that apply to renting and consigning with BORROW.",
};

const H = "mt-8 font-serif text-2xl font-medium";
const P = "mt-2 text-[15px] leading-relaxed text-ink/70";

export default function TermsPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
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
        <span className="w-24" />
      </header>

      <div className="mx-auto max-w-2xl px-6 pb-10">
        <h1 className="mt-6 font-serif text-4xl font-medium">Terms</h1>
        <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-ink/45">
          BORROW LLC · Fayetteville, AR
        </p>

        <h2 className={H}>Rentals</h2>
        <p className={P}>
          Pieces rent for a 7-day window and are due back by the due date. Every
          rental price already includes the Cleaning &amp; Care Fee, which covers
          professional cleaning between wears. Please do not clean the item
          yourself; return it as-is and BORROW takes care of all cleaning. This
          is not damage insurance. Each rental includes a hanger, which must be
          returned with the piece.
        </p>

        <h2 className={H}>Late returns</h2>
        <p className={P}>
          Late returns are charged $15 per item per day to the payment method
          on file, capped at the piece&apos;s recorded replacement value.
        </p>

        <h2 className={H}>Damage &amp; replacement</h2>
        <p className={P}>
          You&apos;re responsible for items damaged beyond normal wear,
          stained beyond cleaning, lost, or not returned. Repairable damage is
          charged at the actual repair cost; a lost or unrepairable piece is
          charged at its recorded replacement value. By renting, you authorize
          these charges to the payment method on file, as presented at
          checkout.
        </p>

        <h2 className={H}>Cancellations</h2>
        <p className={P}>
          Reservations are paid in full to hold the piece. A reservation
          canceled 48 or more hours before the scheduled pickup is refunded the
          rental price; tax is non-refundable.
          Cancellations within 48 hours of pickup, no-shows, and cancellations
          after pickup are non-refundable, as the piece can no longer be
          offered to another renter.
        </p>

        <h2 className={H}>Consignment</h2>
        <p className={P}>
          Consignors earn 20% of the rental price on each completed rental of
          their pieces; any late fees are retained by BORROW. Each consigned piece carries an agreed
          replacement value confirmed at intake. If a piece is lost or damaged
          beyond repair, BORROW pays the consignor that replacement value
          regardless of whether it is recovered from the renter. Full details
          are in the Consignor Agreement signed at intake.
        </p>

        <h2 className={H}>Texts &amp; email</h2>
        <p className={P}>
          If you opt in, we may send service and marketing messages. Message
          and data rates may apply; reply STOP to opt out of texts anytime.
        </p>

        <h2 className={H}>Questions</h2>
        <p className={P}>
          DM @borrowfayetteville on Instagram, or visit us at 2171 Main Dr,
          Fayetteville, AR.
        </p>
      </div>

      <SiteFooter showBrand={false} />
    </main>
  );
}
