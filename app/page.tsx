"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PublicItem,
  EVENT_TYPES,
  SIZES,
  toISO,
  addDays,
  fmtShort,
  findClash,
} from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-base outline-none focus:border-ink/40";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/50";

function money(n: number | string): string {
  return `$${Number(n)}`;
}

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toISO(d);
}

function BookingSheet({
  item,
  onClose,
}: {
  item: PublicItem;
  onClose: () => void;
}) {
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

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
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState("");

  const due = start ? addDays(start, 7) : "";
  const clash = start ? findClash(item.booked, start, due) : null;
  // Mandatory Cleaning & Care Fee on every rental.
  const CLEANING_FEE = 6;
  const total = Number(item.rental_price) + CLEANING_FEE;

  const upcoming = item.booked
    .filter((b) => b.due_date.slice(0, 10) >= toISO(new Date()))
    .slice(0, 4);

  async function book() {
    if (!start || !name.trim() || !phone.trim()) {
      setError("Your name, number and a pickup date are required.");
      return;
    }
    if (clash) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: item.id,
        start_date: start,
        due_date: due,
        name,
        phone,
        email,
        damage_waiver: true,
        notes,
      }),
    });
    if (res.ok) {
      setBooked(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't book — try again.");
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-cream sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {booked ? (
          <div className="px-8 py-16 text-center">
            <h2 className="font-serif text-4xl italic font-medium">
              You&apos;re booked.
            </h2>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-ink/60">
              The {item.brand} is yours {fmtShort(start)} – {fmtShort(due)}.
              {email
                ? ` We've emailed your confirmation to ${email} and we'll send a pickup reminder.`
                : " We'll be in touch to set up pickup."}{" "}
              Total at pickup: {money(total)}.
            </p>
            <button
              onClick={onClose}
              className="mt-8 rounded-full bg-ink px-8 py-3.5 text-base text-cream"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-[260px_1fr]">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-lavender/40 sm:h-full sm:rounded-l-3xl">
              {item.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.photo_url}
                  alt={`${item.brand} dress`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center font-serif text-6xl italic text-ink/20">
                  {item.brand.charAt(0)}
                </div>
              )}
              <button
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full bg-cream/90 px-3 py-1 text-xl leading-none text-ink/60 sm:hidden"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-3xl font-semibold leading-tight">
                    {item.brand}
                  </h2>
                  <p className="mt-1 text-sm text-ink/55">
                    Size {item.size}
                    {item.color ? ` · ${item.color}` : ""} ·{" "}
                    {money(item.rental_price)} for the week
                  </p>
                  {item.event_types.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
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
                </div>
                <button
                  onClick={onClose}
                  className="hidden rounded-full px-3 py-1 text-2xl leading-none text-ink/40 hover:bg-ink/5 sm:block"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className={labelCls}>Pickup day</label>
                  <input
                    type="date"
                    min={tomorrowISO()}
                    className={inputCls}
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                  {start && !clash && (
                    <p className="mt-1.5 text-[13px] text-ink/55">
                      Yours {fmtShort(start)} – {fmtShort(due)} · back by{" "}
                      {fmtShort(due)} to skip late fees ($15/day)
                    </p>
                  )}
                  {clash && (
                    <p className="mt-1.5 rounded-xl bg-blush/30 px-3 py-2 text-[13px]">
                      She&apos;s spoken for {fmtShort(clash.start_date)} –{" "}
                      {fmtShort(clash.due_date)} — pick another week.
                    </p>
                  )}
                  {upcoming.length > 0 && !clash && (
                    <p className="mt-1.5 text-[12px] text-ink/45">
                      Already taken:{" "}
                      {upcoming
                        .map(
                          (b) =>
                            `${fmtShort(b.start_date)}–${fmtShort(b.due_date)}`
                        )
                        .join(", ")}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Name *</label>
                    <input
                      className={inputCls}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Phone *</label>
                    <input
                      type="tel"
                      className={inputCls}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                  <div className="col-span-2">
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

                <div className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-left text-[14px] leading-snug">
                  <span className="font-medium">
                    ${CLEANING_FEE} Cleaning &amp; Care Fee
                  </span>{" "}
                  — added to every rental for professional cleaning and standard
                  handling. This is not damage insurance; you&apos;re responsible
                  for repair or replacement of items damaged beyond normal wear,
                  stained beyond cleaning, lost, or not returned.
                </div>

                <div>
                  <label className={labelCls}>Anything we should know?</label>
                  <input
                    className={inputCls}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="It's for spring formal on Saturday…"
                  />
                </div>

                {error && <p className="text-sm text-blush-deep">{error}</p>}

                <button
                  onClick={book}
                  disabled={saving || !!clash}
                  className="w-full rounded-full bg-ink px-6 py-4 text-base text-cream transition-opacity disabled:opacity-40"
                >
                  {saving
                    ? "Booking…"
                    : `Book it · ${money(total)} at pickup`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Shop() {
  const [items, setItems] = useState<PublicItem[] | null>(null);
  const [error, setError] = useState("");
  const [fSize, setFSize] = useState("");
  const [fEvent, setFEvent] = useState("");
  const [open, setOpen] = useState<PublicItem | null>(null);
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    setHasAccount(!!localStorage.getItem("borrow_account_token"));
    (async () => {
      try {
        const res = await fetch("/api/collection");
        if (!res.ok) throw new Error();
        setItems(await res.json());
      } catch {
        setError("The closet didn't load — refresh to try again.");
      }
    })();
  }, []);

  const sizes = useMemo(() => {
    const present = new Set((items ?? []).map((i) => i.size));
    return SIZES.filter((s) => present.has(s));
  }, [items]);

  const list = useMemo(() => {
    let l = items ?? [];
    if (fSize) l = l.filter((i) => i.size === fSize);
    if (fEvent) l = l.filter((i) => i.event_types?.includes(fEvent));
    return l;
  }, [items, fSize, fEvent]);

  return (
    <main>
      {/* Top bar */}
      <header className="flex items-center justify-end gap-2 px-5 pt-4">
        {hasAccount ? (
          <a
            href="/account"
            className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream"
          >
            My account
          </a>
        ) : (
          <>
            <a
              href="/account"
              className="rounded-full border border-ink/15 bg-white px-4 py-2 text-[13px] text-ink/70 transition-colors hover:border-ink/35"
            >
              Log in
            </a>
            <a
              href="/account?signup=1"
              className="rounded-full bg-ink px-4 py-2 text-[13px] text-cream"
            >
              Sign up
            </a>
          </>
        )}
      </header>

      {/* Hero */}
      <section className="px-6 pb-10 pt-6 text-center sm:pt-12">
        <h1 className="font-serif text-6xl italic font-medium tracking-tight sm:text-7xl">
          BORROW
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-ink/65">
          Rent the dress, keep the night. A curated closet for formals, date
          parties and game days — yours for the week.
        </p>
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 text-[12px] uppercase tracking-[0.18em] text-ink/45">
          <span>Pick her</span>
          <span className="text-blush-deep">·</span>
          <span>Book your week</span>
          <span className="text-blush-deep">·</span>
          <span>Return by day 7</span>
        </div>
      </section>

      {/* Filters */}
      <section className="sticky top-0 z-30 border-y border-ink/10 bg-cream/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <button
              onClick={() => setFEvent("")}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                fEvent === "" ? "bg-ink text-cream" : "bg-white text-ink/60"
              }`}
            >
              Everything
            </button>
            {EVENT_TYPES.map((ev) => (
              <button
                key={ev}
                onClick={() => setFEvent(fEvent === ev ? "" : ev)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                  fEvent === ev ? "bg-ink text-cream" : "bg-white text-ink/60"
                }`}
              >
                {ev}
              </button>
            ))}
          </div>
          <select
            value={fSize}
            onChange={(e) => setFSize(e.target.value)}
            className="ml-auto rounded-full border border-ink/15 bg-white px-3.5 py-2 text-sm outline-none"
          >
            <option value="">All sizes</option>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        {error ? (
          <p className="py-20 text-center text-ink/50">{error}</p>
        ) : items === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-ink/5"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-serif text-3xl italic text-ink/40">
              {items.length === 0
                ? "The closet is being stocked"
                : "Nothing in that filter — yet"}
            </p>
            <p className="mt-2 text-sm text-ink/45">
              {items.length === 0
                ? "Check back soon — new pieces drop weekly."
                : "Try another event or size."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((item) => (
              <button
                key={item.id}
                onClick={() => setOpen(item)}
                className="group text-left"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white">
                  {item.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo_url}
                      alt={`${item.brand} dress`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-lavender/40">
                      <span className="font-serif text-5xl italic text-ink/25">
                        {item.brand.charAt(0)}
                      </span>
                    </div>
                  )}
                  {item.photos?.[1] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photos[1]}
                      alt={`${item.brand} dress, alternate view`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  )}
                  <span className="absolute bottom-2.5 right-2.5 rounded-full bg-cream/95 px-3 py-1 text-[13px] font-medium">
                    {money(item.rental_price)}
                  </span>
                </div>
                <div className="px-1 pt-2.5">
                  <p className="truncate font-serif text-lg font-semibold leading-tight">
                    {item.brand}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink/50">
                    Size {item.size}
                    {item.color ? ` · ${item.color}` : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-ink/10 bg-white/50 px-6 py-14">
        <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">1</p>
            <h3 className="mt-1 text-xl font-medium">Pick your favorite</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Browse the closet by event or size. Every piece is cleaned and
              inspected between wears.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">2</p>
            <h3 className="mt-1 text-xl font-medium">Book your week</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Choose your pickup day — the dress is yours for 7 days. Pay at
              pickup.
            </p>
          </div>
          <div>
            <p className="font-serif text-3xl italic text-blush-deep">3</p>
            <h3 className="mt-1 text-xl font-medium">Wear &amp; return</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink/55">
              Live your night, bring her back by day 7. Late returns run
              $15/day — don&apos;t do her like that.
            </p>
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 text-center">
        <p className="font-serif text-2xl italic font-medium">BORROW</p>
        <p className="mt-1 text-[12px] uppercase tracking-[0.25em] text-ink/40">
          Rent the dress · Keep the night
        </p>
        <a
          href="/account"
          className="mt-4 inline-block rounded-full border border-ink/15 px-4 py-2 text-[13px] text-ink/55"
        >
          Your account &amp; consignment closet →
        </a>
      </footer>

      {open && <BookingSheet item={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
