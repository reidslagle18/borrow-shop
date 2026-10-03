"use client";

import { useEffect, useMemo, useState } from "react";
import PhotoCarousel from "@/components/PhotoCarousel";
import { PublicItem, addDays, fmtShort, findClash, todayISO } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-base outline-none focus:border-ink/40";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/50";

function money(n: number | string): string {
  // Round to cents so float math (e.g. 115 + 11.21) never leaks "…0000001",
  // and drop the decimals on whole-dollar amounts so prices stay clean.
  const v = Math.round(Number(n) * 100) / 100;
  return `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

function tomorrowISO(): string {
  return addDays(todayISO(), 1);
}

/**
 * The full product detail + booking form, shared style with the old modal but
 * built to fill a real page. The column is min-w-0 and everything is width-
 * constrained so nothing can push the page into horizontal scroll on mobile.
 */
export default function ProductView({ item }: { item: PublicItem }) {
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [policyOk, setPolicyOk] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [reservationsOpen, setReservationsOpen] = useState("");
  const [closedDates, setClosedDates] = useState<string[]>([]);
  const [closedWeekdays, setClosedWeekdays] = useState<number[]>([]);

  // Record the view for the "Most loved" (most-clicked) sort. Fire-and-forget.
  useEffect(() => {
    if (!item?.id) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id }),
    }).catch(() => {});
  }, [item?.id]);

  // logged-in shoppers don't retype their info
  useEffect(() => {
    try {
      const saved = localStorage.getItem("borrow_profile");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.name) setName(p.name);
        if (p.phone) setPhone(p.phone);
        if (p.email) setEmail(p.email);
      }
    } catch {}
  }, []);

  // Live tax rate + launch date from the studio so totals match the backend.
  // (The Cleaning & Care Fee is already included in the rental price.)
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => {
        if (c?.sales_tax_rate != null) setTaxRate(Number(c.sales_tax_rate));
        if (c?.reservations_open != null)
          setReservationsOpen(String(c.reservations_open));
        if (Array.isArray(c?.closed_dates)) setClosedDates(c.closed_dates.map(String));
        if (Array.isArray(c?.closed_weekdays)) setClosedWeekdays(c.closed_weekdays.map(Number));
      })
      .catch(() => {});
  }, []);

  // Closed on a one-off closed date OR a recurring closed weekday (e.g. every
  // Sunday & Monday). Weekday read at noon UTC so it's tz-stable.
  const isClosed = (d: string) =>
    !!d &&
    (closedDates.includes(d) ||
      (closedWeekdays.length > 0 &&
        closedWeekdays.includes(new Date(`${d}T12:00:00Z`).getUTCDay())));

  // A closed return day rolls forward to the next open day (bring it back then).
  const rollOpen = (d: string) => {
    let x = d;
    let g = 0;
    while (x && isClosed(x) && g < 366) {
      x = addDays(x, 1);
      g++;
    }
    return x;
  };

  const minPickup = rollOpen(
    reservationsOpen && reservationsOpen > tomorrowISO()
      ? reservationsOpen
      : tomorrowISO()
  );

  const due = start ? addDays(start, 7) : "";
  const effectiveDue = due ? rollOpen(due) : "";
  const clash = start ? findClash(item.booked, start, effectiveDue) : null;
  // A closed PICKUP day blocks checkout; a closed RETURN day just rolls forward.
  const closedPickup = start && isClosed(start) ? start : null;
  const returnRolled = !!due && effectiveDue !== due; // chosen return lands on a closed day
  const taxTotal = Math.round(Number(item.rental_price) * taxRate) / 100;
  const total = Number(item.rental_price) + taxTotal;

  const upcoming = useMemo(
    () =>
      item.booked
        .filter((b) => b.due_date.slice(0, 10) >= todayISO())
        .slice(0, 4),
    [item.booked]
  );

  const photos = item.photos?.length
    ? item.photos
    : item.photo_url
      ? [item.photo_url]
      : [];

  async function book() {
    if (!start || !name.trim() || !phone.trim()) {
      setError("Your name, number and a pickup date are required.");
      return;
    }
    if (!policyOk) {
      setError("Please acknowledge the cancellation policy.");
      return;
    }
    if (start < minPickup) {
      setError(`Pickups begin ${fmtShort(minPickup)}, please choose a later day.`);
      return;
    }
    if (closedPickup) {
      setError(
        `We are closed ${fmtShort(closedPickup)}, so pickup cannot be that day. Please choose another pickup day.`
      );
      return;
    }
    if (clash) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: item.id,
          start_date: start,
          due_date: due,
          name,
          phone,
          email,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url; // off to Stripe Checkout
        return;
      }
      setError(data.error || "Couldn't start checkout, try again.");
    } catch {
      setError("We couldn't reach BORROW. Check your connection and try again.");
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:gap-10">
      {/* Photos, fixed 3:4 frame, sticky beside the details on desktop */}
      <div className="w-full lg:sticky lg:top-6 lg:self-start">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-lavender/40">
          <PhotoCarousel photos={photos} alt={`${item.brand} dress`} />
        </div>
      </div>

      {/* Details + booking */}
      <div className="w-full min-w-0">
        <h1 className="font-serif text-3xl font-semibold leading-tight sm:text-4xl">
          {item.brand}
        </h1>
        <p className="mt-1.5 text-sm text-ink/55">
          Size {item.size}
          {item.color ? ` · ${item.color}` : ""} ·{" "}
          <span className="font-semibold text-ink">
            {money(item.rental_price)} for the week
          </span>{" "}
          <span className="text-ink/45">· Cleaning &amp; Care Fee already included</span>
        </p>
        {item.retail_value != null && Number(item.retail_value) > 0 && (
          <p className="mt-1 text-[15px] font-medium text-ink/55">
            Retails for {money(item.retail_value)}
          </p>
        )}
        {item.event_types.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {item.event_types.map((ev) => (
              <span
                key={ev}
                className="rounded-full bg-lavender/60 px-2.5 py-0.5 text-[11px]"
              >
                {ev}
              </span>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className={labelCls}>Pickup day</label>
            <input
              type="date"
              min={minPickup}
              className={inputCls}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            {reservationsOpen && reservationsOpen > tomorrowISO() && (
              <p className="mt-1.5 text-[13px] text-ink/55">
                Reserve now, pickups begin {fmtShort(reservationsOpen)}.
              </p>
            )}
            {start && !clash && !closedPickup && (
              <p className="mt-1.5 text-[13px] text-ink/55">
                Yours {fmtShort(start)} – {fmtShort(effectiveDue)} · back by{" "}
                {fmtShort(effectiveDue)} to skip late fees ($15/day)
              </p>
            )}
            {closedPickup && !clash && (
              <p className="mt-1.5 rounded-xl bg-blush/30 px-3 py-2 text-[13px]">
                We are closed {fmtShort(closedPickup)}, so pickup cannot be that
                day. Please pick another day.
              </p>
            )}
            {returnRolled && !closedPickup && !clash && (
              <p className="mt-1.5 rounded-xl bg-sage/30 px-3 py-2 text-[13px]">
                We are closed {fmtShort(due)}, so just bring it back the next open
                day, {fmtShort(effectiveDue)}. No extra charge.
              </p>
            )}
            {clash && (
              <p className="mt-1.5 rounded-xl bg-blush/30 px-3 py-2 text-[13px]">
                Reserved {fmtShort(clash.start_date)} –{" "}
                {fmtShort(clash.due_date)}, pick another week.
              </p>
            )}
            {upcoming.length > 0 && !clash && (
              <p className="mt-1.5 text-[12px] text-ink/45">
                Already taken:{" "}
                {upcoming
                  .map((b) => `${fmtShort(b.start_date)}–${fmtShort(b.due_date)}`)
                  .join(", ")}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Name *</label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelCls}>Phone *</label>
              <input
                type="tel"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="w-full rounded-xl border-2 border-sage/60 bg-sage/25 px-3.5 py-3 text-left text-[14px] leading-snug">
            <span className="font-bold">
              Cleaning &amp; Care Fee already included.
            </span>{" "}
            Every rental price already covers professional cleaning between wears,
            so there&apos;s nothing extra to add at checkout.{" "}
            <span className="font-bold">Please don&apos;t clean it yourself.</span>{" "}
            Return it as-is and we take care of all cleaning. This is not damage
            insurance; you&apos;re responsible for repair or replacement of items
            damaged beyond normal wear, stained beyond cleaning, lost, or not
            returned.
          </div>

          <div className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[14px] text-ink/60">
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
              Order summary
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between gap-3">
                <span>
                  {item.brand}{" "}
                  <span className="text-ink/40">· Size {item.size}</span>
                </span>
                <span>{money(item.rental_price)}</span>
              </div>
              <div className="flex justify-between gap-3 text-[13px] text-ink/45">
                <span>
                  {start ? `${fmtShort(start)} – ${fmtShort(due)}` : "Pick your week above"}
                </span>
                <span>{start ? "one week" : ""}</span>
              </div>
              <div className="flex justify-between pt-1 text-[13px] text-ink/45">
                <span>Cleaning &amp; Care Fee</span>
                <span>Included</span>
              </div>
              {taxTotal > 0 && (
                <div className="flex justify-between">
                  <span>Sales tax ({taxRate}%)</span>
                  <span>{money(taxTotal)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-ink/10 pt-1.5 text-[15px] font-medium text-ink">
                <span>Total due today</span>
                <span>{money(total)}</span>
              </div>
            </div>
          </div>

          <div className="w-full rounded-xl bg-butter/30 px-3.5 py-3 text-left text-[13px] leading-relaxed text-ink/70">
            <span className="font-medium">Cancellation Policy:</span> Reservations
            are paid in full to hold the piece. Cancel 48 or more hours before
            your pickup date and the rental price is refunded to your card (tax is
            non-refundable). Cancellations within 48 hours of pickup, no-shows,
            and cancellations after pickup are non-refundable, as the piece can no
            longer be offered to another renter.
          </div>

          <label className="flex items-start gap-2.5 text-[14px]">
            <input
              type="checkbox"
              checked={policyOk}
              onChange={(e) => setPolicyOk(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-ink"
            />
            <span>I understand and agree to the cancellation policy.</span>
          </label>

          {error && <p className="text-sm text-blush-deep">{error}</p>}

          <button
            onClick={book}
            disabled={saving || !!clash || !!closedPickup || !policyOk}
            className="w-full rounded-full bg-ink px-6 py-4 text-base text-cream transition-opacity disabled:opacity-40"
          >
            {saving ? "Taking you to checkout…" : `Pay & reserve · ${money(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
