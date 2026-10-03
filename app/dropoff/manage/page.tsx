"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-ink/40";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.15em] text-ink/50";

function todayISO(): string {
  // Studio-local (America/Chicago) date, not UTC — en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
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

type Appt = { date: string; time: string; item_count: number; name: string; status: string };

function ManageInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [appt, setAppt] = useState<Appt | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // reschedule flow
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slot, setSlot] = useState("");

  // action state
  const [busy, setBusy] = useState<"cancel" | "reschedule" | null>(null);
  const [actionError, setActionError] = useState("");
  const [flash, setFlash] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  const loadAppt = useCallback(async () => {
    if (!token) {
      setLoadError("This link is missing its appointment code. Check the link in your email.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/dropoff-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "view" }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setAppt(d as Appt);
      else setLoadError(d.error || "We couldn't find that appointment.");
    } catch {
      setLoadError("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAppt();
  }, [loadAppt]);

  // Load available times when a new date is picked for rescheduling.
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

  async function doReschedule() {
    if (!date || !slot) {
      setActionError("Pick a new day and time.");
      return;
    }
    setActionError("");
    setBusy("reschedule");
    try {
      const res = await fetch("/api/dropoff-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "reschedule", date, time: slot }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setAppt({
          date: d.date,
          time: d.time,
          item_count: d.item_count,
          name: d.name,
          status: d.status || "booked",
        });
        setRescheduling(false);
        setDate("");
        setSlot("");
        setFlash("Your appointment has been moved. We updated our calendar and emailed nothing extra, so you're all set.");
      } else {
        setActionError(d.error || "Couldn't reschedule, try again.");
        if (res.status === 409 && date) {
          // Slot just taken — refresh availability.
          fetch(`/api/dropoff?date=${date}`)
            .then((r) => r.json())
            .then((x) => setSlots(x.slots || []))
            .catch(() => {});
          setSlot("");
        }
      }
    } catch {
      setActionError("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function doCancel() {
    setActionError("");
    setBusy("cancel");
    try {
      const res = await fetch("/api/dropoff-manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action: "cancel" }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setAppt((a) => (a ? { ...a, status: "cancelled" } : a));
        setConfirmCancel(false);
        setRescheduling(false);
        setFlash("Your appointment is cancelled and the time is freed up. Book again anytime.");
      } else {
        setActionError(d.error || "Couldn't cancel, try again.");
      }
    } catch {
      setActionError("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  const isBooked = appt?.status === "booked";

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="text-center">
        <Link href="/" className="font-serif text-4xl italic font-medium">
          BORROW
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink/45">
          Your drop-off
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md">
        {loading ? (
          <div className="h-52 animate-pulse rounded-3xl bg-ink/5" />
        ) : loadError ? (
          <div className="rounded-3xl bg-white p-8 text-center">
            <p className="text-[15px] leading-relaxed text-ink/70">{loadError}</p>
            <Link
              href="/dropoff"
              className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-[15px] text-cream"
            >
              Book a drop-off
            </Link>
          </div>
        ) : appt ? (
          <div className="rounded-3xl bg-white p-7">
            {/* Current status */}
            {appt.status === "cancelled" ? (
              <p className="mb-4 rounded-full bg-blush/30 px-4 py-2 text-center text-[13px] font-medium uppercase tracking-[0.1em] text-blush-deep">
                Cancelled
              </p>
            ) : appt.status === "completed" ? (
              <p className="mb-4 rounded-full bg-sage/30 px-4 py-2 text-center text-[13px] font-medium uppercase tracking-[0.1em] text-sage-deep">
                All done, thank you!
              </p>
            ) : null}

            <p className="text-center text-[11px] uppercase tracking-[0.25em] text-ink/45">
              {isBooked ? "You're booked for" : "Appointment"}
            </p>
            <p className="mt-2 text-center font-serif text-2xl font-medium">
              {prettyDate(appt.date)}
            </p>
            <p className="mt-1 text-center text-[16px] text-ink/70">
              {prettyTime(appt.time)} · {appt.item_count} item
              {appt.item_count === 1 ? "" : "s"}
            </p>

            {flash && (
              <p className="mt-5 rounded-2xl bg-sage/20 px-4 py-3 text-center text-[14px] leading-relaxed text-ink/75">
                {flash}
              </p>
            )}

            {isBooked && !flash && (
              <>
                {!rescheduling ? (
                  <div className="mt-7 space-y-2.5">
                    <button
                      onClick={() => {
                        setRescheduling(true);
                        setActionError("");
                      }}
                      className="w-full rounded-full bg-ink px-6 py-3.5 text-[15px] text-cream"
                    >
                      Reschedule
                    </button>
                    {!confirmCancel ? (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="w-full rounded-full border border-ink/20 bg-white px-6 py-3.5 text-[15px] text-ink/70"
                      >
                        Cancel appointment
                      </button>
                    ) : (
                      <div className="rounded-2xl bg-blush/15 p-4 text-center">
                        <p className="text-[14px] leading-relaxed text-ink/75">
                          Cancel this drop-off? This frees the time for someone else.
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={doCancel}
                            disabled={busy === "cancel"}
                            className="flex-1 rounded-full bg-ink px-4 py-3 text-[14px] text-cream disabled:opacity-40"
                          >
                            {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
                          </button>
                          <button
                            onClick={() => setConfirmCancel(false)}
                            className="flex-1 rounded-full border border-ink/20 bg-white px-4 py-3 text-[14px] text-ink/70"
                          >
                            Keep it
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-7">
                    <label className={labelCls}>Pick a new day</label>
                    <input
                      type="date"
                      className={inputCls}
                      min={todayISO()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                    {date && (
                      <div className="mt-4">
                        <label className={labelCls}>Available times</label>
                        {slots === null ? (
                          <p className="text-sm text-ink/45">Loading times…</p>
                        ) : slots.length === 0 ? (
                          <p className="rounded-xl bg-blush/25 px-4 py-3 text-sm text-ink/70">
                            No openings that day, please pick another.
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
                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={doReschedule}
                        disabled={busy === "reschedule" || !slot}
                        className="flex-1 rounded-full bg-ink px-5 py-3.5 text-[15px] text-cream disabled:opacity-40"
                      >
                        {busy === "reschedule"
                          ? "Saving…"
                          : slot
                            ? `Move to ${prettyTime(slot)}`
                            : "Pick a time"}
                      </button>
                      <button
                        onClick={() => {
                          setRescheduling(false);
                          setDate("");
                          setSlot("");
                          setActionError("");
                        }}
                        className="rounded-full border border-ink/20 bg-white px-5 py-3.5 text-[15px] text-ink/70"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {actionError && (
              <p className="mt-4 text-center text-sm text-blush-deep">{actionError}</p>
            )}

            <div className="mt-7 text-center">
              <Link href="/" className="text-[14px] text-ink/50 underline underline-offset-2">
                Back to the closet
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}

export default function ManagePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-5 py-10">
          <div className="mx-auto mt-10 h-52 max-w-md animate-pulse rounded-3xl bg-ink/5" />
        </main>
      }
    >
      <ManageInner />
    </Suspense>
  );
}
