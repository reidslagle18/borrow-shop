export interface BookedRange {
  start_date: string;
  due_date: string;
}

export interface PublicItem {
  id: string;
  brand: string;
  description?: string | null;
  size: string;
  color: string | null;
  silhouette: string | null;
  style_tags?: string[] | null;
  occasion_tags?: string[] | null; // top-level occasions, e.g. ["Vacation","Date Night"]
  sub_occasion_tags?: string[] | null; // namespaced "Occasion:Sub", e.g. ["Vacation:Beach"]
  tier: "standard" | "mid" | "premium";
  rental_price: string | number;
  retail_value: string | number | null;
  event_types: string[];
  photo_url: string | null;
  photos: string[];
  status: string;
  set_group?: string | null;
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
  "Bridal",
  "Night Out",
];

export const SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
  "00",
  "0",
  "2",
  "4",
  "6",
  "8",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "One Size",
];

/** URL-safe slug from arbitrary text. */
export function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * A unique, human-readable URL handle for a piece — e.g. "free-people-brw-0042".
 * The brand makes it readable; the id keeps it unique and shareable. Computed the
 * same way on the grid (for the link) and on the product page (to resolve it).
 */
export function itemSlug(item: { brand: string; id: string }): string {
  const base = slugify(item.brand);
  const idPart = slugify(item.id);
  return base ? `${base}-${idPart}` : idPart;
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date in the studio's timezone (America/Chicago), YYYY-MM-DD. Pins
 *  "today"/"tomorrow" to Fayetteville local time so it never rolls a day ahead
 *  in UTC (which is what .toISOString() would give) for evening shoppers. */
export function todayISO(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "01";
  return `${g("year")}-${g("month")}-${g("day")}`;
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

/**
 * A friendly availability read for the view-only Lookbook. `reservable` means
 * the piece lives in the normal (bookable) closet — used only to decide whether
 * to offer a "find it in the closet" link back to the reservable flow. The
 * Lookbook itself never books anything. `tone` drives the badge color.
 */
export type Availability = {
  reservable: boolean;
  label: string;
  tone: "available" | "out" | "soon" | "hold";
  detail: string;
};

export function availabilityOf(item: {
  status: string;
  booked: BookedRange[];
}): Availability {
  switch (item.status) {
    case "cleaning":
      return {
        reservable: false,
        tone: "soon",
        label: "Being refreshed",
        detail:
          "Freshly returned and getting cleaned and inspected — back on the racks soon.",
      };
    case "consignor_hold":
      return {
        reservable: false,
        tone: "hold",
        label: "On hold",
        detail:
          "Temporarily held by its owner, so it isn't available to rent right now.",
      };
    case "in_storage":
      return {
        reservable: false,
        tone: "out",
        label: "Archived",
        detail:
          "Resting in the archive. DM us if you'd love to see this one back on the racks.",
      };
    case "with_consignor":
      return {
        reservable: false,
        tone: "out",
        label: "Currently out",
        detail:
          "Back with its owner at the moment, so it isn't available to rent.",
      };
    case "rented":
      // Physically out with a renter right now (this holds even when the rental
      // is overdue and the feed carries no covering date range for it).
      return {
        reservable: true,
        tone: "out",
        label: "Rented now",
        detail:
          "Out on rental right now. You can still reserve an open week in the closet.",
      };
  }
  // Otherwise it's a live closet piece — check whether it's out on a rental today.
  const today = todayISO();
  const outNow = item.booked.find(
    (b) => b.start_date.slice(0, 10) <= today && b.due_date.slice(0, 10) >= today
  );
  if (outNow) {
    return {
      reservable: true,
      tone: "out",
      label: "Rented now",
      detail: `Out on rental through ${fmtShort(
        outNow.due_date
      )}. You can still reserve an open week in the closet.`,
    };
  }
  return {
    reservable: true,
    tone: "available",
    label: "Available now",
    detail: "Available to reserve in the closet.",
  };
}
