import Link from "next/link";

/* Full-width photo hero with an overlaid wordmark/heading and optional button.
   Mobile-first: the image always covers, the text scrim keeps it legible. */
export default function Hero({
  imageUrl = "",
  heading = "BORROW",
  subheading = "",
  align = "Bottom right",
  buttonLabel = "",
  buttonHref = "",
  height = "Tall",
}: {
  imageUrl?: string;
  heading?: string;
  subheading?: string;
  align?: "Center" | "Bottom left" | "Bottom right";
  buttonLabel?: string;
  buttonHref?: string;
  height?: "Short" | "Medium" | "Tall";
}) {
  const h =
    height === "Short" ? "min-h-[46vh]" : height === "Medium" ? "min-h-[62vh]" : "min-h-[80vh]";
  const place =
    align === "Center"
      ? "items-center justify-center text-center"
      : align === "Bottom left"
        ? "items-end justify-start text-left"
        : "items-end justify-end text-right";

  return (
    <section className={`relative flex w-full overflow-hidden ${h} ${place} px-6 pb-10 sm:px-12 sm:pb-12`}>
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/15 to-transparent"
      />
      <div className="relative z-[2] max-w-2xl">
        {heading && (
          <h1 className="font-serif leading-[0.9] tracking-tight text-cream [text-shadow:0_1px_4px_rgba(0,0,0,0.55),0_4px_26px_rgba(0,0,0,0.4)] text-6xl sm:text-8xl">
            {heading}
          </h1>
        )}
        {subheading && (
          <p className="mt-3 text-[15px] leading-relaxed text-cream/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.5)] sm:text-lg">
            {subheading}
          </p>
        )}
        {buttonLabel && buttonHref && (
          <Link
            href={buttonHref}
            className="mt-5 inline-block rounded-full bg-cream px-7 py-3.5 text-[14px] font-medium text-ink transition-transform hover:scale-[1.03]"
          >
            {buttonLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
