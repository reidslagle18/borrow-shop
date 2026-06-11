export interface BookedRange {
  start_date: string;
  due_date: string;
}

export interface PublicItem {
  id: string;
  brand: string;
  size: string;
  color: string | null;
  tier: "standard" | "mid" | "premium";
  rental_price: string | number;
  event_types: string[];
  photo_url: string | null;
  status: string;
  booked: BookedRange[];
}

export const EVENT_TYPES = [
  "Formal",
  "Semi-Formal",
  "Date Party",
  "Game Day",
  "Rush",
  "Graduation",
  "Wedding Guest",
  "Night Out",
];

export const SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "0",
  "2",
  "4",
  "6",
  "8",
  "10",
  "12",
  "One Size",
];

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + n);
  return toISO(date);
}

export function fmtShort(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Does [start, end] overlap any booked range? Returns the clash or null. */
export function findClash(
  booked: BookedRange[],
  start: string,
  end: string
): BookedRange | null {
  return (
    booked.find(
      (b) => b.start_date.slice(0, 10) <= end && b.due_date.slice(0, 10) >= start
    ) ?? null
  );
}
