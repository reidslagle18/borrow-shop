/* Shared brand options for the Plasmic-editable sections. Keeping the palette as
   a fixed choice list is what "locks" the brand: editors pick a named BORROW
   tone, never an arbitrary hex. The classes resolve to the tokens in
   app/globals.css, so fonts + colors always match the rest of the site. */

export const BG_CHOICES = [
  "White",
  "Soft pink",
  "Soft lavender",
  "Warm white",
  "Sage",
  "Yellow",
] as const;

export type BgChoice = (typeof BG_CHOICES)[number];

export const BG_CLASS: Record<string, string> = {
  White: "bg-cream",
  "Soft pink": "bg-petal",
  "Soft lavender": "bg-mist",
  "Warm white": "bg-cloud",
  Sage: "bg-sage/35",
  Yellow: "bg-butter/55",
};
