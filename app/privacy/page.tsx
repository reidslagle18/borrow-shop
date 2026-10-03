import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy Policy · BORROW",
  description: "How BORROW collects, uses, and protects your information.",
};

const H = "mt-8 font-serif text-2xl font-medium";
const P = "mt-2 text-[15px] leading-relaxed text-ink/70";

export default function PrivacyPage() {
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
        <h1 className="mt-6 font-serif text-4xl font-medium">Privacy Policy</h1>
        <p className="mt-2 text-[13px] uppercase tracking-[0.18em] text-ink/45">
          BORROW LLC · Fayetteville, AR
        </p>

        <h2 className={H}>What we collect</h2>
        <p className={P}>
          When you reserve a piece, create an account, consign, or book a
          drop-off, we collect the basics we need to serve you: your name,
          phone number, email, and your rental and consignment history with
          us. If you opt into texts or emails, we keep that preference too.
        </p>

        <h2 className={H}>Payments</h2>
        <p className={P}>
          Payments are processed by Stripe, our payment provider. Your card
          number never touches our servers. Stripe stores it securely and
          gives us a reference so we can charge the card you authorized (for
          example, for your rental or fees you agreed to in the rental
          agreement). Consignor payout details (like bank info) are collected
          and stored by Stripe, not by us.
        </p>

        <h2 className={H}>How we use your information</h2>
        <p className={P}>
          We use your information to run your rentals and consignments:
          confirmations, pickup and return reminders, payout notices, and
          service messages. If you opted in, we may also send occasional
          marketing messages, and you can unsubscribe anytime; texting STOP
          always works.
        </p>

        <h2 className={H}>What we don&apos;t do</h2>
        <p className={P}>
          We don&apos;t sell your personal information, and we don&apos;t share
          it with third parties except the services that make BORROW work
          (payment processing, email/text delivery, and website hosting).
        </p>

        <h2 className={H}>Your choices</h2>
        <p className={P}>
          You can ask us to update or delete your information anytime. DM
          @borrowfayetteville on Instagram or stop by the studio and
          we&apos;ll take care of it.
        </p>
      </div>

      <SiteFooter showBrand={false} />
    </main>
  );
}
