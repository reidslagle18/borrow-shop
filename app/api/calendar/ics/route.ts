/**
 * Subscribable iCal feed of Borrow's bookings (both Borrow and e.closet
 * channels), for pasting into Google / Apple Calendar so the calendar stays in
 * sync. Server-side it pulls the studio's anonymized booking feed (no customer
 * data) and emits all-day events. Public URL — safe because it's pieces + dates
 * only.
 */
type Booking = {
  id: number;
  piece: string;
  barcode: string | null;
  start_date: string;
  due_date: string;
  status: string;
  channel: "borrow" | "ecloset";
};

const esc = (s: string) =>
  String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const compact = (iso: string) => iso.replace(/-/g, ""); // YYYY-MM-DD -> YYYYMMDD
function plusOneDay(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  let bookings: Booking[] = [];
  if (base && key) {
    try {
      const res = await fetch(`${base}/api/public/calendar`, {
        headers: { "x-api-key": key },
        cache: "no-store",
      });
      if (res.ok) bookings = (await res.json()).bookings || [];
    } catch {
      /* serve an empty (but valid) calendar rather than error a subscription */
    }
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Borrow Fayetteville//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Borrow Fayetteville — Bookings",
    "NAME:Borrow Fayetteville — Bookings",
    "X-WR-TIMEZONE:America/Chicago",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];
  for (const b of bookings) {
    const tag = b.channel === "ecloset" ? "e.closet" : "Borrow";
    lines.push(
      "BEGIN:VEVENT",
      `UID:booking-${b.id}@borrowfayetteville.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(b.start_date)}`,
      `DTEND;VALUE=DATE:${compact(plusOneDay(b.due_date))}`, // DTEND is exclusive for all-day
      `SUMMARY:${esc(b.piece)} — ${tag}`,
      `DESCRIPTION:${esc(`${b.status === "active" ? "Out on rent" : "Reserved"} · ${tag}${b.barcode ? ` · ${b.barcode}` : ""}`)}`,
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="borrow-bookings.ics"',
      "Cache-Control": "no-store",
    },
  });
}
