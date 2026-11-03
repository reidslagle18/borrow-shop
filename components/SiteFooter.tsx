import Link from "next/link";
import Bow from "@/components/Bow";

/**
 * Shared site footer: an editorial, branded footer on a soft pink field. Brand
 * block on the left, three tidy link columns, a slim legal bar underneath. Every
 * link points at an existing page — visual layer only.
 */
const COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "The Closet",
    links: [
      { label: "Shop rentals", href: "/shop" },
      { label: "Full collection", href: "/lookbook" },
      { label: "Size guide", href: "/size-guide" },
    ],
  },
  {
    heading: "Your Account",
    links: [
      { label: "My account", href: "/account" },
      { label: "Consignor studio", href: "/portal" },
      { label: "Book a drop-off", href: "/dropoff" },
    ],
  },
  {
    heading: "Good to Know",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
    ],
  },
];

export default function SiteFooter({ showBrand = true }: { showBrand?: boolean }) {
  return (
    <footer className="mt-20 border-t border-blush/40 bg-petal">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand block */}
          <div>
            {showBrand && (
              <>
                <div className="flex items-center gap-2.5">
                  <Bow className="h-5 w-7 text-blush-deep" />
                  <span className="font-serif text-3xl leading-none tracking-[0.02em]">
                    BORROW
                  </span>
                </div>
                <p className="script mt-3 text-2xl text-blush-deep">
                  rent your outfit, save the stress
                </p>
              </>
            )}
            <p className="mt-5 text-[13px] leading-relaxed text-ink/55">
              A curated closet in Fayetteville.
              <br />
              2171 Main Dr, Fayetteville, AR
            </p>
            <a
              href="https://instagram.com/borrowfayetteville"
              className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-ink/70 link-underline"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
              </svg>
              @borrowfayetteville
            </a>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <p className="kicker mb-3">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[14px] text-ink/65 link-underline hover:text-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Legal bar */}
      <div className="border-t border-blush/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-5 text-[12px] text-ink/45 sm:flex-row">
          <p>© {new Date().getFullYear()} BORROW LLC · Fayetteville, AR</p>
          <p>
            Questions? DM{" "}
            <a
              href="https://instagram.com/borrowfayetteville"
              className="font-medium text-ink/60 link-underline"
            >
              @borrowfayetteville
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
