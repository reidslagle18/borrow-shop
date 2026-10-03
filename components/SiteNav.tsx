"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* Shared top navigation for the redesigned storefront. Logo left, links center,
   search + account right (no cart — Borrow reserves one piece at a time). On a
   hero it can render transparent; elsewhere it's solid cream. Mobile collapses
   to a slide-down menu. Visual layer only — every link points at an existing
   working page. */

const CATEGORY_LINKS = [
  { label: "Dresses", href: "/shop?category=Dresses" },
  { label: "Sets", href: "/shop?category=Sets" },
  { label: "Tops", href: "/shop?category=Tops" },
  { label: "Skirts", href: "/shop?category=Skirts" },
  { label: "Pants", href: "/shop?category=Pants" },
];
const OCCASION_LINKS = [
  { label: "Vacation", href: "/shop?occasion=Vacation" },
  { label: "Gameday", href: "/shop?occasion=Gameday" },
  { label: "Date Night", href: "/shop?occasion=Date+Night" },
  { label: "Wedding Guest", href: "/shop?occasion=Wedding+Guest" },
  { label: "Graduation", href: "/shop?occasion=Graduation" },
  { label: "Formal", href: "/shop?occasion=Formal" },
];
const ABOUT_LINKS = [
  { label: "FAQ", href: "/#faq" },
  { label: "Size guide", href: "/size-guide" },
  { label: "Store Hours & Location", href: "/#visit" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

export default function SiteNav({ transparent = false }: { transparent?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // A transparent (over-hero) nav turns solid once you scroll past the hero.
  useEffect(() => {
    if (!transparent) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [transparent]);

  const solid = !transparent || scrolled || menuOpen;
  const textCls = solid ? "text-ink" : "text-cream drop-shadow-sm";

  const navLink =
    "text-[15px] font-medium uppercase tracking-[0.08em] transition-opacity hover:opacity-60";

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        solid ? "border-b border-ink/10 bg-cream/95 backdrop-blur" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        {/* Logo */}
        <Link
          href="/"
          className={`font-serif text-2xl italic font-medium leading-none ${textCls}`}
        >
          BORROW
        </Link>

        {/* Center links (desktop) — order intentionally differs from the
            reference site; the logo doubles as Home. */}
        <nav className={`hidden items-center gap-9 md:flex ${textCls}`}>
          <div className="group relative">
            <Link href="/shop" className={`${navLink} inline-flex items-center gap-1`}>
              Shop Rentals
              <span className="text-[10px]">▾</span>
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 w-[22rem] -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="grid grid-cols-2 gap-5 rounded-2xl border border-ink/10 bg-cream p-5 text-ink shadow-xl">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ink/40">
                    Shop by Category
                  </p>
                  <ul className="space-y-1.5">
                    {CATEGORY_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-[14px] hover:text-blush-deep">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ink/40">
                    Shop by Occasion
                  </p>
                  <ul className="space-y-1.5">
                    {OCCASION_LINKS.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className="text-[14px] hover:text-blush-deep">
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link href="/dropoff" className={navLink}>
            Rent Out Your Clothes
          </Link>
          <div className="group relative">
            <span className={`${navLink} inline-flex cursor-default items-center gap-1`}>
              About
              <span className="text-[10px]">▾</span>
            </span>
            <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <ul className="space-y-1.5 rounded-2xl border border-ink/10 bg-cream p-5 text-ink shadow-xl">
                {ABOUT_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[14px] hover:text-blush-deep">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>

        {/* Right icons */}
        <div className={`flex items-center gap-3 ${textCls}`}>
          <Link href="/shop" aria-label="Search" className="hover:opacity-60">
            <SearchIcon />
          </Link>
          <Link href="/account" aria-label="Account" className="hover:opacity-60">
            <AccountIcon />
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="md:hidden"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" aria-hidden="true">
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-ink/10 bg-cream px-5 py-5 text-ink md:hidden">
          <div className="space-y-3.5">
            <Link href="/shop" onClick={() => setMenuOpen(false)} className="block text-[17px] font-medium">
              Shop Rentals
            </Link>
            <div className="pl-3">
              <p className="mb-1 mt-1 text-[11px] uppercase tracking-[0.18em] text-ink/40">
                Category
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {CATEGORY_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-[14px] text-ink/70">
                    {l.label}
                  </Link>
                ))}
              </div>
              <p className="mb-1 mt-2 text-[11px] uppercase tracking-[0.18em] text-ink/40">
                Occasion
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {OCCASION_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-[14px] text-ink/70">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <Link href="/dropoff" onClick={() => setMenuOpen(false)} className="block text-[17px] font-medium">
              Rent Out Your Clothes
            </Link>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/10 pt-3">
              {ABOUT_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="text-[13px] text-ink/60">
                  {l.label}
                </Link>
              ))}
              <Link href="/account" onClick={() => setMenuOpen(false)} className="text-[13px] text-ink/60">
                My account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
