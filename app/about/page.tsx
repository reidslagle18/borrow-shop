import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SplitFeature from "@/components/plasmic/SplitFeature";
import { tryPlasmicPage } from "@/components/plasmic/PlasmicEditable";

export const metadata: Metadata = {
  title: "About · BORROW",
  description: "A curated rental closet in Fayetteville, Arkansas.",
};

export const revalidate = 300;

export default async function AboutPage() {
  const plasmic = await tryPlasmicPage("/about");
  if (plasmic) return plasmic;
  return <AboutBody />;
}

/* Coded fallback shown until an /about page is published in Plasmic. */
function AboutBody() {
  return (
    <main>
      <SiteNav />
      <section className="px-6 pb-4 pt-16 text-center">
        <p className="kicker">Our story</p>
        <h1 className="mt-2 font-serif text-5xl italic font-medium sm:text-6xl">About Borrow</h1>
        <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-ink/65">
          Borrow is a curated rental closet in Fayetteville, Arkansas — formals,
          date parties, wedding-guest dresses, game days, and more, yours for the
          week. Find your outfit, book your week, and return by day 7.
        </p>
      </section>

      <SplitFeature
        imageUrl="/store/life/studio-1.jpg"
        imageSide="Left"
        background="Soft pink"
        kicker="How it works"
        heading="Rent the look, skip the closet full of one-wears"
        body="Browse the closet by occasion or size, reserve your piece, and pick it up right here in Fayetteville. Every piece is professionally cleaned and inspected between wears, so it arrives fresh and ready."
        buttonLabel="Shop the closet →"
        buttonHref="/shop"
      />

      <SplitFeature
        imageUrl="/store/life/studio-2.jpg"
        imageSide="Right"
        background="Sage"
        kicker="Consign with Borrow"
        heading="Have pieces to drop off?"
        body="Bring in the dresses you're done with, and you earn 20% every time one rents. Book a quick appointment and we'll handle the photography, listing, and cleaning."
        buttonLabel="Rent out your clothes →"
        buttonHref="/dropoff"
      />

      <section className="px-6 py-16 text-center">
        <p className="text-[15px] text-ink/60">
          Come visit us at 2171 Main Dr, Fayetteville, AR.
        </p>
        <Link
          href="/#visit"
          className="mt-4 inline-block rounded-full bg-ink px-7 py-3.5 text-[14px] font-medium text-cream transition-transform hover:scale-[1.03]"
        >
          Store hours &amp; location →
        </Link>
      </section>

      <SiteFooter />
    </main>
  );
}
