import type { Metadata } from "next";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Size Guide · BORROW",
  description:
    "A general size chart to help you find your fit at BORROW. Sizes run to each brand's own sizing — check the piece's page for fit notes.",
};

// General women's size reference (approximate, in inches). Brands vary — this is
// a starting point, not a guarantee.
const ROWS = [
  { size: "XXS", us: "00", bust: "31–32", waist: "23–24", hips: "33–34" },
  { size: "XS", us: "0–2", bust: "32–33", waist: "24–25", hips: "34–35" },
  { size: "S", us: "4–6", bust: "34–35", waist: "26–27", hips: "36–37" },
  { size: "M", us: "8–10", bust: "36–38", waist: "28–30", hips: "38–40" },
  { size: "L", us: "12–14", bust: "39–41", waist: "31–33", hips: "41–43" },
  { size: "XL", us: "16–18", bust: "42–44", waist: "34–36", hips: "44–46" },
];

const H = "mt-9 font-serif text-2xl font-medium";
const P = "mt-2 text-[15px] leading-relaxed text-ink/70";

export default function SizeGuidePage() {
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
        <h1 className="mt-6 font-serif text-4xl font-medium">Size guide</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/65">
          A general reference to help you find your fit. Every piece lists its
          size on its own page, and you can filter the closet by size. Sizes run
          to each brand&apos;s own sizing, so check the piece&apos;s description
          for any fit notes, and try it on at pickup.
        </p>

        {/* Size chart */}
        <div className="mt-6 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
          <table className="w-full min-w-[420px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-ink/10 bg-blush/25 text-ink/70">
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">US</th>
                <th className="px-4 py-3 font-medium">Bust (in)</th>
                <th className="px-4 py-3 font-medium">Waist (in)</th>
                <th className="px-4 py-3 font-medium">Hips (in)</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <tr
                  key={r.size}
                  className={i % 2 ? "bg-cream/40" : "bg-white"}
                >
                  <td className="px-4 py-3 font-serif text-[16px] italic text-blush-deep">
                    {r.size}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{r.us}</td>
                  <td className="px-4 py-3 text-ink/70">{r.bust}</td>
                  <td className="px-4 py-3 text-ink/70">{r.waist}</td>
                  <td className="px-4 py-3 text-ink/70">{r.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[13px] text-ink/45">
          Measurements are approximate and vary by brand and cut. When in doubt,
          size up for a relaxed fit or reach out before you book.
        </p>

        <h2 className={H}>How to measure</h2>
        <p className={P}>
          <span className="font-medium text-ink/80">Bust</span> — around the
          fullest part of your chest, keeping the tape level.
          <br />
          <span className="font-medium text-ink/80">Waist</span> — around the
          narrowest part, usually just above the belly button.
          <br />
          <span className="font-medium text-ink/80">Hips</span> — around the
          fullest part, with your feet together.
        </p>

        <h2 className={H}>Still unsure?</h2>
        <p className={P}>
          DM{" "}
          <a
            href="https://instagram.com/borrowfayetteville"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            @borrowfayetteville
          </a>{" "}
          with the piece you&apos;re eyeing and your measurements, and we&apos;ll
          help you find the right fit. You can always try it on at pickup, too.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="inline-block rounded-full bg-ink px-6 py-3 text-[15px] text-cream"
          >
            Browse the closet →
          </Link>
        </div>
      </div>

      <SiteFooter showBrand={false} />
    </main>
  );
}
