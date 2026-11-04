import Link from "next/link";
import { BG_CLASS } from "./brand";

/* Photo + text, side by side (stacks on phones). The editorial building block
   used for the Lookbook / "about" style blocks. */
export default function SplitFeature({
  imageUrl = "",
  imageSide = "Left",
  background = "Soft pink",
  kicker = "",
  heading = "A little about us",
  body = "",
  buttonLabel = "",
  buttonHref = "",
}: {
  imageUrl?: string;
  imageSide?: "Left" | "Right";
  background?: keyof typeof BG_CLASS;
  kicker?: string;
  heading?: string;
  body?: string;
  buttonLabel?: string;
  buttonHref?: string;
}) {
  const panel = BG_CLASS[background] ?? "bg-petal";
  return (
    <section className="px-5 py-10">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-3xl sm:grid-cols-2">
        <div className={`relative aspect-[4/5] sm:aspect-auto ${imageSide === "Right" ? "sm:order-2" : ""}`}>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <div className={`flex flex-col justify-center ${panel} px-8 py-14 text-center sm:px-12 sm:text-left`}>
          {kicker && <p className="kicker">{kicker}</p>}
          {heading && (
            <h2 className="mt-2 font-serif text-4xl italic font-medium leading-tight sm:text-5xl">
              {heading}
            </h2>
          )}
          {body && (
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/65 sm:mx-0">
              {body}
            </p>
          )}
          {buttonLabel && buttonHref && (
            <Link
              href={buttonHref}
              className="mx-auto mt-6 inline-block w-max rounded-full bg-ink px-7 py-3.5 text-[14px] font-medium text-cream transition-transform hover:scale-[1.03] sm:mx-0"
            >
              {buttonLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
