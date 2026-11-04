import { initPlasmicLoader } from "@plasmicapp/loader-nextjs/react-server-conditional";

import AnnouncementBanner from "@/components/plasmic/AnnouncementBanner";
import Hero from "@/components/plasmic/Hero";
import SplitFeature from "@/components/plasmic/SplitFeature";
import ProductRow from "@/components/plasmic/ProductRow";
import FaqSection from "@/components/plasmic/FaqSection";
import { BG_CHOICES } from "@/components/plasmic/brand";

/* ---------------------------------------------------------------------------
   Plasmic loader for the public marketing pages.

   The project ID + public API token are safe to ship to the browser (that's how
   the loader is designed). They're read from env so the connection can be
   swapped or disabled without a code change, with the current project as the
   default. `preview: false` means only PUBLISHED Plasmic content is served in
   production — unpublished drafts never leak to shoppers.
--------------------------------------------------------------------------- */
const PROJECT_ID = process.env.NEXT_PUBLIC_PLASMIC_PROJECT_ID || "tL22ehUrQmhbVAsFZD9ZiZ";
const PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_PLASMIC_PROJECT_TOKEN ||
  "wUebvt2Rws9ylm6kFzLjJjKKNGaIhyv04WxAqzCnKit5XghnHyHLCn9ePXcjULZTawLyNHqSJ2ZHYhUFwE9w";

export const PLASMIC = initPlasmicLoader({
  projects: [{ id: PROJECT_ID, token: PROJECT_TOKEN }],
  // Only published designs render in production; flip to true only for a
  // dedicated draft-preview deployment.
  preview: false,
});

const bgChoices = [...BG_CHOICES];

PLASMIC.registerComponent(AnnouncementBanner, {
  name: "Announcement banner",
  description: "Slim dismissible strip for the very top of a page.",
  props: {
    text: { type: "string", defaultValue: "Free local pickup in Fayetteville · New arrivals every week" },
    linkLabel: { type: "string" },
    linkHref: { type: "href" },
    tone: { type: "choice", options: ["Sage", "Pink", "Yellow", "Black"], defaultValue: "Sage" },
    dismissible: { type: "boolean", defaultValue: true },
  },
});

PLASMIC.registerComponent(Hero, {
  name: "Hero",
  description: "Full-width photo hero with an overlaid wordmark and optional button.",
  props: {
    imageUrl: { type: "imageUrl" },
    heading: { type: "string", defaultValue: "BORROW" },
    subheading: { type: "string" },
    align: { type: "choice", options: ["Center", "Bottom left", "Bottom right"], defaultValue: "Bottom right" },
    buttonLabel: { type: "string" },
    buttonHref: { type: "href" },
    height: { type: "choice", options: ["Short", "Medium", "Tall"], defaultValue: "Tall" },
  },
});

PLASMIC.registerComponent(SplitFeature, {
  name: "Photo + text",
  description: "An image beside a text panel (stacks on phones).",
  props: {
    imageUrl: { type: "imageUrl" },
    imageSide: { type: "choice", options: ["Left", "Right"], defaultValue: "Left" },
    background: { type: "choice", options: bgChoices, defaultValue: "Soft pink" },
    kicker: { type: "string" },
    heading: { type: "string", defaultValue: "A little about us" },
    body: { type: "string" },
    buttonLabel: { type: "string" },
    buttonHref: { type: "href" },
  },
});

PLASMIC.registerComponent(ProductRow, {
  name: "Product row",
  description: "A live row of real rental pieces from the shop.",
  props: {
    kicker: { type: "string", defaultValue: "Our picks" },
    heading: { type: "string", defaultValue: "Featured" },
    source: { type: "choice", options: ["Featured", "Most loved"], defaultValue: "Featured" },
    count: { type: "number", defaultValue: 4 },
    linkLabel: { type: "string", defaultValue: "Shop all rentals →" },
    linkHref: { type: "href", defaultValue: "/shop" },
  },
});

PLASMIC.registerComponent(FaqSection, {
  name: "FAQ",
  description: "Accordion of questions and answers.",
  props: {
    heading: { type: "string", defaultValue: "Good to know" },
    background: { type: "choice", options: bgChoices, defaultValue: "Soft lavender" },
    items: {
      type: "array",
      itemType: {
        type: "object",
        fields: {
          question: { type: "string" },
          answer: { type: "string", control: "large" },
        },
        nameFunc: (item: { question?: string }) => item?.question,
      },
      defaultValue: [
        { question: "How does sizing work?", answer: "Every piece lists its size on the tag and its page, and you can filter the closet by your size." },
        { question: "What if it doesn't fit?", answer: "Try it on at pickup, and if it isn't right we'll help you find a piece that is." },
      ],
    },
  },
});
