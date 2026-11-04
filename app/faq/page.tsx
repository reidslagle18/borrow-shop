import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import FaqSection from "@/components/plasmic/FaqSection";
import { tryPlasmicPage } from "@/components/plasmic/PlasmicEditable";

export const metadata: Metadata = {
  title: "FAQ · BORROW",
  description: "Sizing, fit, cleaning, late returns, and how consignment works at BORROW.",
};

export const revalidate = 300;

const FAQS = [
  { question: "How does sizing work?", answer: "Every piece lists its size on the tag and its page, and you can filter the closet by your size. Sizes run true to the brand's own sizing, and we note fit quirks in the piece's description when they matter." },
  { question: "What if it doesn't fit?", answer: "Try it on at pickup, and if it isn't right we'll help you find a piece that is. Reservations are paid in full to hold the piece; cancel 48 or more hours before pickup and the rental price is refunded to your card (tax is non-refundable). Within 48 hours of pickup, no-shows, and after pickup are non-refundable." },
  { question: "What's the Cleaning & Care Fee?", answer: "It's already included in every rental price, so there's nothing extra to add at checkout. It covers professional cleaning and inspection between wears, so every piece arrives fresh. Please don't clean the piece yourself; just return it as-is and we take care of all cleaning." },
  { question: "What if I return it late?", answer: "Pieces are due back by day 7 so the next renter isn't left waiting. Late returns are charged $15 per item per day to the card on file, capped at the piece's replacement value." },
  { question: "How does consignment work?", answer: "Bring us the pieces you never reach for; we photograph, list, rent, and clean them, and you earn 20% of every rental, paid straight to your bank. Book a drop-off appointment to get started, and you can retrieve your pieces anytime they aren't rented or reserved." },
];

export default async function FaqPage() {
  const plasmic = await tryPlasmicPage("/faq");
  if (plasmic) return plasmic;
  return (
    <main>
      <SiteNav />
      <section className="px-6 pt-16 text-center">
        <p className="kicker">Questions, answered</p>
        <h1 className="mt-2 font-serif text-5xl italic font-medium sm:text-6xl">FAQ</h1>
      </section>
      <FaqSection heading="" background="White" items={FAQS} />
      <SiteFooter />
    </main>
  );
}
