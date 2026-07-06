"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-ink/40";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.15em] text-ink/50";

const GUIDELINES = [
  "Borrow is a curated closet, so we're selective about what we carry — bring your best, current, on-trend pieces in excellent condition. All items should be clean and ready to rent; we're unable to accept anything stained, damaged, or in need of cleaning.",
  "We may accept some, all, or none of what you bring in — that's what keeps the closet special.",
  "Accepted pieces are consigned to you: you earn 60% every time yours rents, and you can retrieve any piece at any time, as long as it isn't currently rented out or reserved.",
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
function prettyTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
function prettyDate(d: string): string {
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DropoffPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [count, setCount] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ date: string; time: string; count: number } | null>(null);

  // Load available slots whenever a date is picked.
  useEffect(() => {
    if (!date) {
      setSlots(null);
      return;
    }
    setSlots(null);
    setSlot("");
    fetch(`/api/dropoff?date=${date}`)
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => setSlots(d.slots || []))
      .catch(() => setSlots([]));
  }, [date]);

  async function submit() {
    setError("");
    if (!name.trim() || !phone.trim()) return setError("Please add your name and phone.");
    if (!count || Number(count) < 1) return setError("How many items are you bringing?");
    if (!agreed) return setError("Please check the box to agree to the guidelines.");
    if (!date || !slot) return setError("Pick a day and a time.");
    setBusy(true);
    const res = await fetch("/api/dropoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        item_count: Number(count),
        date,
        time: slot,
        agreed: true,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setDone({ date: d.date, time: d.time, count: d.item_count });
    } else {
      setError(d.error || "Couldn't book — try again.");
      if (res.status === 409) {
        // Slot taken — refresh availability.
        fetch(`/api/dropoff?date=${date}`)
          .then((r) => r.json())
          .then((x) => setSlots(x.slots || []))
          .catch(() => {});
        setSlot("");
      }
    }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="text-center">
        <Link href="/" className="font-serif text-4xl italic font-medium">
          BORROW
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink/45">
          Book a drop-off
        </p>
      </div>

      {done ? (
        <div className="mx-auto mt-12 max-w-md rounded-3xl bg-white p-8 text-center">
          <p className="font-serif text-5xl italic text-sage-deep">✓</p>
          <h1 className="mt-3 font-serif text-3xl font-medium">You&apos;re booked</h1>
          <p className="mt-3 text-[16px] leading-relaxed">
            <strong>
              {prettyDate(done.date)} at {prettyTime(done.time)}
            </strong>
            <br />
            {done.count} item{done.count === 1 ? "" : "s"}
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/55">
            We emailed you a confirmation with the details and guidelines. See you
            then! Bring your best clean, on-trend pieces.
          </p>
          <Link
            href="/"
            className="mt-7 inline-block rounded-full bg-ink px-7 py-3 text-[15px] text-cream"
          >
            Back to the closet
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <h1 className="font-serif text-3xl font-medium">Bring in your pieces</h1>

          {/* Guidelines (must read + agree) */}
          <div className="mt-4 space-y-3 rounded-2xl bg-lavender/25 p-5 text-[14px] leading-relaxed text-ink/75">
            {GUIDELINES.map((g) => (
              <p key={g}>{g}</p>
            ))}
          </div>

          {/* Contact + item count */}
          <div className="mt-6 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
              <div>
                <label className={labelCls}>Phone *</label>
                <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Email</label>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="For your confirmation" />
              </div>
              <div>
                <label className={labelCls}>How many items are you bringing? *</label>
                <input className={inputCls} type="number" min={1} inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value)} />
              </div>
            </div>
          </div>

          <label className="mt-4 flex items-start gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-ink"
            />
            <span>I understand and agree.</span>
          </label>

          {/* Date + time */}
          <div className="mt-6">
            <label className={labelCls}>Pick a day</label>
            <input
              type="date"
              className={inputCls}
              min={todayISO()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {date && (
            <div className="mt-4">
              <label className={labelCls}>Available times</label>
              {slots === null ? (
                <p className="text-sm text-ink/45">Loading times…</p>
              ) : slots.length === 0 ? (
                <p className="rounded-xl bg-blush/25 px-4 py-3 text-sm text-ink/70">
                  No openings that day — please pick another.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`rounded-full border px-2 py-2.5 text-sm ${
                        slot === s
                          ? "border-ink bg-ink text-cream"
                          : "border-ink/15 bg-white text-ink/70"
                      }`}
                    >
                      {prettyTime(s)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-blush-deep">{error}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-base text-cream transition-opacity disabled:opacity-40"
          >
            {busy
              ? "Booking…"
              : slot
                ? `Book ${prettyTime(slot)}`
                : "Book drop-off appointment"}
          </button>
        </div>
      )}

      <footer className="mt-16 pb-6 text-center text-[12px] uppercase tracking-[0.25em] text-ink/35">
        <Link href="/">← Back to the closet</Link>
      </footer>
    </main>
  );
}
