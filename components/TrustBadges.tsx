/**
 * A quiet row of reassurance points, placed under "How it works". Icons are
 * inline SVG (no dependencies) and inherit the ink color. Edit BADGES to change
 * the copy.
 */

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Sparkle = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 2.5l2.1 6.4 6.4 2.1-6.4 2.1L12 19.5l-2.1-6.4L3.5 11l6.4-2.1z" />
  </svg>
);
const Lock = () => (
  <svg {...iconProps} aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);
const Hanger = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 6.4a1.8 1.8 0 1 1 1.5 1.8c-.6.1-1 .5-1 1.1v.5l8 4.4c.6.3 1 .8 1 1.5 0 1-.8 1.8-1.9 1.8H4.4c-1.1 0-1.9-.8-1.9-1.8 0-.7.4-1.2 1-1.5l8-4.4" />
  </svg>
);
const Pin = () => (
  <svg {...iconProps} aria-hidden="true">
    <path d="M12 21s6.5-5.3 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.7 12 21 12 21z" />
    <circle cx="12" cy="10.3" r="2.4" />
  </svg>
);

const BADGES = [
  { icon: <Sparkle />, label: "Cleaned & inspected between every wear" },
  { icon: <Lock />, label: "Secure checkout" },
  { icon: <Hanger />, label: "Curated, not mass-produced" },
  { icon: <Pin />, label: "Fayetteville owned & operated" },
];

export default function TrustBadges() {
  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-4">
      {BADGES.map((b) => (
        <div key={b.label} className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blush/35 text-ink/70">
            {b.icon}
          </span>
          <p className="max-w-[9.5rem] text-[13px] leading-snug text-ink/65">
            {b.label}
          </p>
        </div>
      ))}
    </div>
  );
}
