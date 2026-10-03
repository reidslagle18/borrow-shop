"use client";

import { useEffect, useMemo, useState } from "react";

type Booking = {
  id: number;
  piece: string;
  barcode: string | null;
  start_date: string;
  due_date: string;
  status: string;
  channel: "borrow" | "ecloset";
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/calendar")
      .then((r) => (r.ok ? r.json() : { bookings: [] }))
      .then((d) => setBookings(d.bookings || []))
      .catch(() => setBookings([]));
  }, []);

  // Map each YYYY-MM-DD -> bookings out that day (inclusive of due date).
  const byDay = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    for (const b of bookings ?? []) {
      const d = new Date(b.start_date + "T12:00:00Z");
      const end = new Date(b.due_date + "T12:00:00Z");
      for (let i = 0; i < 400 && d <= end; i++) {
        (m[iso(d)] ||= []).push(b);
        d.setUTCDate(d.getUTCDate() + 1);
      }
    }
    return m;
  }, [bookings]);

  const gridDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayISO = iso(new Date());
  const icsUrl = origin ? `${origin}/api/calendar/ics` : "";
  const webcalUrl = icsUrl.replace(/^https?:/, "webcal:");

  function copy() {
    navigator.clipboard?.writeText(icsUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-serif text-2xl italic">BORROW</span>
            <span className="ml-2 text-[10px] uppercase tracking-[0.3em] text-ink/45">Bookings</span>
          </div>
          <span className="text-[12px] text-ink/40">Read-only · updates hourly</span>
        </div>

        <h1 className="mt-5 font-serif text-3xl font-medium md:text-4xl">Booking calendar</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-ink/55">
          Every piece currently reserved or out on rent — across Borrow and e.closet — so both
          stores can see what&apos;s spoken for. No customer details, just what&apos;s booked and when.
        </p>

        {/* Subscribe / sync */}
        <div className="mt-5 rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-[15px] font-medium">Subscribe to keep it in sync</p>
          <p className="mt-0.5 text-[13px] text-ink/55">
            Add this to Google or Apple Calendar and it refreshes on its own — no re-importing.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-xl bg-cream px-3 py-2 text-[12px] text-ink/70">
              {icsUrl || "…"}
            </code>
            <button onClick={copy} className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream">
              {copied ? "Copied ✓" : "Copy link"}
            </button>
            <a
              href={webcalUrl || "#"}
              className="rounded-full border border-ink/15 px-4 py-2 text-[13px] text-ink/70 hover:bg-cream"
            >
              Add to calendar
            </a>
          </div>
          <p className="mt-2 text-[12px] text-ink/45">
            Google Calendar → Other calendars → “From URL” → paste the link. Apple Calendar → File → New Calendar
            Subscription → paste.
          </p>
        </div>

        {/* Legend */}
        <div className="mt-5 flex items-center gap-4 text-[12px] text-ink/60">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-lavender" /> Borrow</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blush" /> e.closet</span>
        </div>

        {/* Calendar */}
        <div className="mt-3 overflow-hidden rounded-2xl border border-ink/10 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              className="rounded-full px-3 py-1 text-lg leading-none text-ink/50 hover:bg-cream"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="font-serif text-xl font-medium">{monthLabel}</span>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              className="rounded-full px-3 py-1 text-lg leading-none text-ink/50 hover:bg-cream"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 border-b border-ink/10">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-center text-[11px] uppercase tracking-widest text-ink/40">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {gridDays.map((d) => {
              const key = iso(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const items = byDay[key] || [];
              const isToday = key === todayISO;
              return (
                <div
                  key={key}
                  className={`min-h-[84px] border-b border-r border-ink/5 p-1.5 align-top ${
                    inMonth ? "" : "bg-cream/40 opacity-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${
                      isToday ? "bg-ink text-cream" : "text-ink/60"
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {items.slice(0, 3).map((b, i) => (
                      <div
                        key={b.id + "-" + i}
                        title={`${b.piece} — ${b.channel === "ecloset" ? "e.closet" : "Borrow"}`}
                        className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${
                          b.channel === "ecloset" ? "bg-blush/50" : "bg-lavender/50"
                        }`}
                      >
                        {b.piece}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="px-1 text-[10px] text-ink/40">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {bookings !== null && bookings.length === 0 && (
          <p className="mt-4 text-sm text-ink/45">No active bookings right now.</p>
        )}
      </div>
    </div>
  );
}
