/**
 * The signature motif — a fine-line hand-drawn bow. Used sparingly as Borrow's
 * little "girly but expensive" detail (logo accent, section dividers, empty
 * states). Inherits currentColor so it adapts to any section's accent.
 */
export default function Bow({
  className = "",
  strokeWidth = 1.4,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* left loop */}
      <path d="M24 16c-3-5-7-9-12-9-4 0-6 3-6 7s3 7 7 7c5 0 8-4 11-5z" />
      {/* right loop */}
      <path d="M24 16c3-5 7-9 12-9 4 0 6 3 6 7s-3 7-7 7c-5 0-8-4-11-5z" />
      {/* knot */}
      <path d="M22 13c1.3-1 2.7-1 4 0 1 .8 1 4.2 0 5-1.3 1-2.7 1-4 0-1-.8-1-4.2 0-5z" />
      {/* tails */}
      <path d="M22 20c-2 4-3.5 7-6 10M26 20c2 4 3.5 7 6 10" />
    </svg>
  );
}
