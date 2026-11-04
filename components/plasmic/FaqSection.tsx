"use client";

import { useState } from "react";
import { BG_CLASS } from "./brand";

type Faq = { question?: string; answer?: string };

/* An accordion of questions. Items are editable in Plasmic (add / remove / edit
   each Q + A). Styling and motion are locked to the brand. */
export default function FaqSection({
  heading = "Good to know",
  background = "Soft lavender",
  items = [
    { question: "How does sizing work?", answer: "Every piece lists its size on the tag and its page, and you can filter the closet by your size." },
  ],
}: {
  heading?: string;
  background?: keyof typeof BG_CLASS;
  items?: Faq[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const panel = BG_CLASS[background] ?? "bg-mist";
  const list = (items ?? []).filter((f) => f?.question);

  return (
    <section className={`${panel} border-t border-lavender/50 px-6 py-16 sm:py-20`}>
      <div className="mx-auto max-w-2xl">
        {heading && (
          <h2 className="text-center font-serif text-4xl italic font-medium">{heading}</h2>
        )}
        <div className="mt-8 space-y-2.5">
          {list.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="overflow-hidden rounded-2xl border border-ink/10 bg-cream">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[16px] font-medium"
                >
                  {f.question}
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`h-4 w-4 shrink-0 text-ink/40 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[14px] leading-relaxed text-ink/60">{f.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
