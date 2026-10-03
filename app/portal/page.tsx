"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { fmtShort } from "@/lib/types";

type PortalItem = {
  id: string;
  brand: string;
  size: string;
  color: string | null;
  rental_price: string | number;
  photo_url: string | null;
  status: string;
  rental_count: number;
  earned: number;
  retrieval_requested?: boolean;
  hold_start?: string | null; // self-hold start date, if a hold is in place
  hold_end?: string | null; // self-hold requested return date
  booked: { start_date: string; due_date: string }[];
};

type PendingApproval = {
  id: string;
  brand: string;
  description: string | null;
  photo_url: string | null;
  replacement_value: string | number | null;
  approval_status: string;
  disputed_value?: string | number | null;
  dispute_note?: string | null;
  dispute_outcome?: string | null;
};

const APPROVAL_CONTEXT =
  "This is the amount you'd be paid only in the rare case your item is lost by a renter or damaged beyond repair. It's a safety net, not something we expect to use. The vast majority of items rent and return with no issue. Please review the amount below.";

type Portal = {
  name: string;
  rate?: number; // this consignor's locked commission %
  retrieval_cleaning_fee?: number; // $ deducted when a piece is retrieved
  items: PortalItem[];
  payouts: { amount: string | number; method: string | null; paid_at: string }[];
  earnings?: { id: number; date: string; brand: string; amount: number }[];
  pending_approvals?: PendingApproval[];
  earned: number;
  paid: number;
  owed: number;
  direct_deposit?: {
    active: boolean;
    started: boolean;
    action_needed?: boolean;
    verifying?: boolean;
  };
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  available: { label: "On the rack", cls: "bg-sage" },
  reserved: { label: "Reserved", cls: "bg-lavender" },
  rented: { label: "Rented out", cls: "bg-blush" },
  consignor_hold: { label: "On hold for you", cls: "bg-blush-deep/25" },
  cleaning: { label: "Being cleaned", cls: "bg-butter" },
  with_consignor: { label: "With you", cls: "bg-lavender" },
  retired: { label: "Returned to you", cls: "bg-ink/10 text-ink/60" },
};

function money(n: number | string): string {
  const v = Number(n);
  return `$${v % 1 === 0 ? v : v.toFixed(2)}`;
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight ? "bg-butter" : "bg-cream/70"
      }`}
    >
      <p className="font-serif text-2xl font-semibold leading-none">{value}</p>
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-ink/50">
        {label}
      </p>
    </div>
  );
}

export default function PortalPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [portal, setPortal] = useState<Portal | null>(null);
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState<{ email?: string; phone?: string; code?: string } | null>(null);
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");
  const [justReturned, setJustReturned] = useState(false);
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeValue, setDisputeValue] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [disputeErr, setDisputeErr] = useState("");
  // Self-hold requests (request a piece back for a date range)
  const [retrievingId, setRetrievingId] = useState<string | null>(null);
  const [retrieveNote, setRetrieveNote] = useState("");
  const [holdStart, setHoldStart] = useState("");
  const [holdEnd, setHoldEnd] = useState("");
  const [cleaningAck, setCleaningAck] = useState(false);
  const [retrieveErr, setRetrieveErr] = useState("");

  // Approve a piece's replacement value, then refresh the hub.
  async function approve(itemId: string) {
    if (!creds) return;
    setBusyItem(itemId);
    try {
      await fetch("/api/portal-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creds, item_id: itemId, action: "approve" }),
      });
      await login(creds);
    } finally {
      setBusyItem(null);
    }
  }

  // Submit a dispute with a suggested value + optional note.
  async function submitDispute(itemId: string) {
    if (!creds) return;
    const suggested = Number(disputeValue);
    if (!Number.isFinite(suggested) || suggested <= 0) {
      setDisputeErr("Enter the amount you think is fair.");
      return;
    }
    setBusyItem(itemId);
    setDisputeErr("");
    try {
      await fetch("/api/portal-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          item_id: itemId,
          action: "dispute",
          suggested_value: suggested,
          note: disputeNote.trim() || null,
        }),
      });
      setDisputingId(null);
      setDisputeValue("");
      setDisputeNote("");
      await login(creds);
    } finally {
      setBusyItem(null);
    }
  }

  // Request a piece back for a date range (a self-hold). No charge, no late fee.
  async function requestRetrieval(itemId: string) {
    if (!creds) return;
    if (!holdStart || !holdEnd) {
      setRetrieveErr("Please choose both a start date and an end date.");
      return;
    }
    if (holdEnd < holdStart) {
      setRetrieveErr("The end date has to be on or after the start date.");
      return;
    }
    if (!cleaningAck) {
      setRetrieveErr("Please check the box to acknowledge the return-clean notice.");
      return;
    }
    setBusyItem(itemId);
    setRetrieveErr("");
    try {
      const res = await fetch("/api/consignor-retrieval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...creds,
          item_id: itemId,
          note: retrieveNote.trim() || null,
          hold_start: holdStart,
          hold_end: holdEnd,
          cleaning_ack: cleaningAck,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRetrievingId(null);
        setRetrieveNote("");
        setHoldStart("");
        setHoldEnd("");
        setCleaningAck(false);
        await login(creds);
      } else {
        setRetrieveErr(data.error || "Couldn't send that request, try again.");
      }
    } catch {
      setRetrieveErr("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setBusyItem(null);
    }
  }

  async function setupDeposit() {
    if (!creds) return;
    setDepositBusy(true);
    setDepositMsg("");
    const res = await fetch("/api/connect-onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creds),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) {
      window.location.href = data.url; // off to Stripe's secure onboarding
    } else {
      setDepositMsg(data.error || "Couldn't start setup, try again.");
      setDepositBusy(false);
    }
  }

  async function login(creds: { email?: string; phone?: string; code?: string }) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPortal(data);
        setCreds(creds);
        // Remember email + phone so they stay logged in (no code needed).
        if (creds.email && creds.phone) {
          localStorage.setItem(
            "borrow_portal_login",
            JSON.stringify({ email: creds.email, phone: creds.phone })
          );
        }
      } else {
        setError(data.error || "That didn't work, try again.");
      }
    } catch {
      setError("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    // A code in the URL (?code=ABC123, from the "your piece rented" email) logs
    // the consignor straight in; otherwise resume a saved email + phone login.
    const params = new URLSearchParams(window.location.search);
    if (params.get("deposit") === "done") setJustReturned(true);
    const fromUrl = params.get("code")?.trim().toUpperCase();
    if (fromUrl) {
      login({ code: fromUrl }).finally(() => setBooting(false));
      return;
    }
    const saved = localStorage.getItem("borrow_portal_login");
    if (saved) {
      try {
        const { email: e, phone: p } = JSON.parse(saved);
        if (e && p) {
          setEmail(e);
          setPhone(p);
          login({ email: e, phone: p }).finally(() => setBooting(false));
          return;
        }
      } catch {
        localStorage.removeItem("borrow_portal_login");
      }
    }
    setBooting(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("borrow_portal_login");
    setPortal(null);
    setEmail("");
    setPhone("");
  }

  // Derived status overview + next-payout hint.
  const total = portal?.items.length ?? 0;
  const onRack = portal?.items.filter((i) => i.status === "available").length ?? 0;
  const rentedOut =
    portal?.items.filter((i) => i.status === "rented" || i.status === "reserved").length ?? 0;
  const awaiting = portal?.pending_approvals?.length ?? 0;
  const dep = portal?.direct_deposit;
  const depChip = dep?.active
    ? { label: "Direct deposit on", cls: "bg-sage" }
    : dep?.verifying || justReturned
      ? { label: "Verifying your details", cls: "bg-butter" }
      : dep?.action_needed
        ? { label: "One step left to get paid", cls: "bg-blush/50" }
        : { label: "Direct deposit not set up", cls: "bg-ink/10 text-ink/60" };
  const upcomingReturns = (portal?.items ?? [])
    .flatMap((i) => i.booked.map((b) => ({ due: b.due_date, brand: i.brand })))
    .sort((a, b) => (a.due < b.due ? -1 : 1));
  const nextReturn = upcomingReturns[0] ?? null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="text-center">
        <Link href="/" className="font-serif text-4xl italic font-medium">
          BORROW
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink/45">
          Consignor studio
        </p>
      </div>

      {booting ? (
        /* Resuming a saved session: friendly loader, no login-form flash. */
        <div className="mx-auto mt-14 max-w-sm text-center">
          <p className="font-serif text-2xl italic text-ink/40">
            Opening your closet…
          </p>
          <div className="mt-6 space-y-2">
            <div className="h-24 animate-pulse rounded-2xl bg-ink/5" />
            <div className="h-16 animate-pulse rounded-2xl bg-ink/5" />
          </div>
        </div>
      ) : !portal ? (
        <div className="mx-auto mt-12 max-w-sm text-center">
          <h1 className="font-serif text-3xl font-medium">
            Check on your pieces
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/55">
            Sign in with the email and phone number BORROW has on file to see
            your closet, what it&apos;s earned, and what&apos;s headed your way.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email.trim() && phone.trim())
                login({ email: email.trim(), phone: phone.trim() });
            }}
            className="mt-6 space-y-3"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-full border border-ink/15 bg-white px-5 py-3.5 text-center text-base outline-none focus:border-ink/40"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone"
              autoComplete="tel"
              className="w-full rounded-full border border-ink/15 bg-white px-5 py-3.5 text-center text-base outline-none focus:border-ink/40"
            />
            {error && <p className="text-sm text-blush-deep">{error}</p>}
            <button
              type="submit"
              disabled={busy || !email.trim() || !phone.trim()}
              className="w-full rounded-full bg-ink px-5 py-3.5 text-base text-cream disabled:opacity-40"
            >
              {busy ? "One sec…" : "See my closet"}
            </button>
          </form>
          <p className="mt-4 text-[13px] text-ink/45">
            Don&apos;t have a code? DM @borrowfayetteville on Instagram,
            consigning takes five minutes and you keep 20% of every rental.
          </p>
        </div>
      ) : (
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-3xl font-medium">
              Hi, {portal.name.split(" ")[0]}.
            </h1>
            <button
              onClick={logout}
              className="text-[13px] text-ink/45 underline underline-offset-2"
            >
              Log out
            </button>
          </div>

          {/* At a glance: the whole picture in one card */}
          <section className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
              At a glance
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Pieces" value={total} />
              <Stat label="On the rack" value={onRack} />
              <Stat label="Rented out" value={rentedOut} />
              {awaiting > 0 ? (
                <a href="#review" className="block">
                  <Stat label="Awaiting you" value={awaiting} highlight />
                </a>
              ) : (
                <Stat label="Awaiting you" value={0} />
              )}
              <Stat label="Coming to you" value={money(portal.owed)} />
              <Stat label="Earned" value={money(portal.earned)} />
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-cream/70 px-3.5 py-2.5">
              <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${depChip.cls}`} />
              <span className="text-[13px] text-ink/70">{depChip.label}</span>
            </div>
          </section>

          {/* Items Awaiting Your Review */}
          {portal.pending_approvals && portal.pending_approvals.length > 0 && (
            <div
              id="review"
              className="mt-5 scroll-mt-6 rounded-2xl border border-butter-deep/30 bg-butter/40 p-5"
            >
              <h2 className="font-serif text-xl font-medium">
                Items Awaiting Your Review ({portal.pending_approvals.length})
              </h2>
              <p className="mt-1 text-[13px] text-ink/60">
                Nothing is listed for rent until you approve it.
              </p>
              <div className="mt-4 space-y-3">
                {portal.pending_approvals.map((p) => {
                  const isDisputed = p.approval_status === "disputed";
                  return (
                    <div key={p.id} className="rounded-xl bg-white p-3">
                      <div className="flex gap-3">
                        <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-lavender/40">
                          {p.photo_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.photo_url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{p.brand}</p>
                          {p.description && (
                            <p className="text-[13px] leading-snug text-ink/55">
                              {p.description}
                            </p>
                          )}
                          <p className="mt-1 text-[15px]">
                            Replacement value:{" "}
                            <strong>{money(p.replacement_value ?? 0)}</strong>
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-[12px] leading-relaxed text-ink/50">
                        {APPROVAL_CONTEXT}
                      </p>

                      {/* Outcome of a prior dispute (now back for review) */}
                      {!isDisputed && p.dispute_outcome === "accepted" && (
                        <p className="mt-2 rounded-lg bg-sage/40 px-3 py-2 text-[13px] leading-relaxed">
                          We updated the value to {money(p.replacement_value ?? 0)}{" "}
                          as you suggested. Please confirm below.
                        </p>
                      )}
                      {!isDisputed && p.dispute_outcome === "rejected" && (
                        <p className="mt-2 rounded-lg bg-blush/25 px-3 py-2 text-[13px] leading-relaxed">
                          We reviewed your suggestion
                          {p.disputed_value
                            ? ` of ${money(p.disputed_value)}`
                            : ""}{" "}
                          and kept the value at {money(p.replacement_value ?? 0)}.
                          Please review it again below.
                        </p>
                      )}

                      {isDisputed ? (
                        <p className="mt-2 rounded-lg bg-butter/60 px-3 py-2 text-[13px] leading-relaxed">
                          You suggested {money(p.disputed_value ?? 0)}. BORROW is
                          reviewing it, and we&apos;ll send it back for your final
                          approval.
                        </p>
                      ) : disputingId === p.id ? (
                        <div className="mt-3 space-y-2">
                          <label className="block text-[13px] text-ink/60">
                            What replacement value do you think is fair?
                          </label>
                          <input
                            type="number"
                            inputMode="decimal"
                            value={disputeValue}
                            onChange={(e) => setDisputeValue(e.target.value)}
                            placeholder="Your suggested value"
                            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-base outline-none focus:border-ink/40"
                          />
                          <textarea
                            value={disputeNote}
                            onChange={(e) => setDisputeNote(e.target.value)}
                            placeholder="Optional: a quick note on why (e.g. what you paid)"
                            className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink/40"
                            rows={2}
                          />
                          {disputeErr && (
                            <p className="text-[13px] text-blush-deep">{disputeErr}</p>
                          )}
                          <div className="flex gap-2">
                            <button
                              onClick={() => submitDispute(p.id)}
                              disabled={busyItem === p.id}
                              className="flex-1 rounded-full bg-ink px-4 py-3 text-[15px] text-cream disabled:opacity-40"
                            >
                              {busyItem === p.id ? "…" : "Submit suggestion"}
                            </button>
                            <button
                              onClick={() => {
                                setDisputingId(null);
                                setDisputeErr("");
                              }}
                              className="rounded-full border border-ink/20 px-4 py-3 text-[15px] text-ink/60"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => approve(p.id)}
                            disabled={busyItem === p.id}
                            className="flex-1 rounded-full bg-ink px-4 py-3 text-[15px] text-cream disabled:opacity-40"
                          >
                            {busyItem === p.id ? "…" : "Approve"}
                          </button>
                          <button
                            onClick={() => {
                              setDisputingId(p.id);
                              setDisputeValue(String(p.replacement_value ?? ""));
                              setDisputeNote("");
                              setDisputeErr("");
                            }}
                            disabled={busyItem === p.id}
                            className="flex-1 rounded-full border border-ink/20 px-4 py-3 text-[15px] text-ink/70 disabled:opacity-40"
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct deposit: three clear states so there's never any guessing */}
          <div className="mt-5 rounded-2xl bg-white p-5">
            {portal.direct_deposit?.active ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-[13px]">
                  ✓
                </span>
                <div>
                  <p className="font-medium">Direct deposit is on</p>
                  <p className="mt-0.5 text-[13px] text-ink/55">
                    Your {portal.rate ?? 60}% is sent straight to your bank
                    automatically every time one of your pieces is returned.
                    Nothing else to do.
                  </p>
                </div>
              </div>
            ) : portal.direct_deposit?.verifying || justReturned ? (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-butter text-[13px]">
                  ⏳
                </span>
                <div>
                  <p className="font-medium">
                    You&apos;re all set, we&apos;re verifying your details
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink/55">
                    Nothing is needed from you. Your earnings are safe, and
                    they&apos;ll start landing in your bank automatically the
                    moment verification finishes (usually within a day or two).
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium">
                  {portal.direct_deposit?.action_needed
                    ? "One quick step left to get paid"
                    : "Get paid automatically"}
                </p>
                <p className="mt-0.5 text-[13px] text-ink/55">
                  {portal.direct_deposit?.action_needed
                    ? "Stripe needs one more thing before your earnings can reach your bank. It takes about two minutes, and your earnings wait safely until it's done."
                    : `Set up direct deposit once and your ${portal.rate ?? 60}% lands in your bank automatically after each rental, no waiting on a check or Venmo.`}
                </p>
                <button
                  onClick={setupDeposit}
                  disabled={depositBusy || !creds}
                  className="mt-3 rounded-full bg-ink px-5 py-3 text-[15px] text-cream disabled:opacity-40"
                >
                  {depositBusy
                    ? "One sec…"
                    : portal.direct_deposit?.started
                      ? "Finish direct deposit setup"
                      : "Set up direct deposit"}
                </button>
                {depositMsg && (
                  <p className="mt-2 text-[13px] text-blush-deep">{depositMsg}</p>
                )}
              </>
            )}
          </div>

          {/* Pieces */}
          <h2 className="mt-8 font-serif text-2xl font-medium">
            Your closet ({portal.items.length})
          </h2>
          <div className="mt-3 space-y-2">
            {portal.items.length === 0 ? (
              <div className="rounded-2xl bg-white p-6 text-center">
                <p className="text-[15px] text-ink/60">No pieces yet.</p>
                <Link
                  href="/dropoff"
                  className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-[15px] text-cream"
                >
                  Book a drop-off to get started
                </Link>
              </div>
            ) : (
              portal.items.map((i) => {
                const s = STATUS_LABEL[i.status] ?? STATUS_LABEL.available;
                const rentedOrReserved =
                  i.status === "rented" || i.status === "reserved";
                const alreadyBack =
                  i.status === "retired" || i.status === "with_consignor";
                const hasUpcoming = i.booked.length > 0;
                // ASAP retrieval needs the piece free now. When it's out or
                // booked, a FUTURE date is still allowed — after the last
                // booking ends. Compute the earliest requestable date.
                const committed = rentedOrReserved || hasUpcoming;
                const lastDue = i.booked.reduce(
                  (m, b) => (b.due_date > m ? b.due_date : m),
                  ""
                );
                const dayAfter = (d: string) => {
                  const dt = new Date(d + "T00:00:00");
                  dt.setDate(dt.getDate() + 1);
                  return dt.toISOString().slice(0, 10);
                };
                const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
                const earliestDate =
                  committed && lastDue ? dayAfter(lastDue) : todayStr;
                // The retrieval flow is offered whenever it isn't already back.
                const canRequest = !alreadyBack;
                return (
                  <div key={i.id} className="rounded-2xl bg-white p-3">
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-lavender/40">
                        {i.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={i.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center font-serif italic text-ink/30">
                            {i.brand.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px]">
                          <span className="font-serif font-semibold">
                            {i.brand}
                          </span>{" "}
                          <span className="text-ink/50">
                            {i.size}
                            {i.color ? ` · ${i.color}` : ""} ·{" "}
                            {money(i.rental_price)}/wk
                          </span>
                        </p>
                        <p className="truncate text-[13px] text-ink/55">
                          rented {i.rental_count}× · you&apos;ve earned{" "}
                          {money(i.earned)}
                        </p>
                        {i.booked.length > 0 && i.status !== "retired" && (
                          <p className="truncate text-[12px] text-ink/45">
                            upcoming:{" "}
                            {i.booked
                              .map(
                                (bk) =>
                                  `${fmtShort(bk.start_date)}–${fmtShort(bk.due_date)}`
                              )
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </div>

                    {/* Self-hold: request a piece back for a specific date range */}
                    {!alreadyBack && (
                      <div className="mt-2 border-t border-ink/5 pt-2">
                        {i.retrieval_requested ? (
                          <p className="text-[13px] text-sage-deep">
                            ✓ On hold for you
                            {i.hold_start
                              ? ` ${fmtShort(i.hold_start)}${
                                  i.hold_end && i.hold_end !== i.hold_start
                                    ? ` – ${fmtShort(i.hold_end)}`
                                    : ""
                                }`
                              : ""}
                            . We&apos;ll have it ready — it stays yours until you
                            bring it back.
                          </p>
                        ) : retrievingId === i.id ? (
                          <div className="space-y-2">
                            <p className="text-[13px] text-ink/70">
                              Hold <span className="font-medium">{i.brand}</span> for
                              yourself. Pick the dates you need it — no charge.
                            </p>
                            {committed && (
                              <p className="text-[12px] text-ink/50">
                                This piece is booked through {fmtShort(lastDue)}, so
                                start on or after {fmtShort(earliestDate)}. It keeps
                                renting until your hold begins.
                              </p>
                            )}
                            <div className="flex gap-2">
                              <div className="flex-1">
                                <label className="block text-[12px] text-ink/50">
                                  Start date
                                </label>
                                <input
                                  type="date"
                                  value={holdStart}
                                  min={earliestDate}
                                  onChange={(e) => setHoldStart(e.target.value)}
                                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-[15px] outline-none focus:border-ink/40"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="block text-[12px] text-ink/50">
                                  End date
                                </label>
                                <input
                                  type="date"
                                  value={holdEnd}
                                  min={holdStart || earliestDate}
                                  onChange={(e) => setHoldEnd(e.target.value)}
                                  className="w-full rounded-xl border border-ink/15 bg-white px-3 py-3 text-[15px] outline-none focus:border-ink/40"
                                />
                              </div>
                            </div>
                            <textarea
                              value={retrieveNote}
                              onChange={(e) => setRetrieveNote(e.target.value)}
                              placeholder="Optional: anything we should know"
                              className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink/40"
                              rows={2}
                            />
                            <label className="flex items-start gap-2 rounded-xl bg-butter/50 px-3 py-2.5 text-[12px] text-ink/70">
                              <input
                                type="checkbox"
                                checked={cleaningAck}
                                onChange={(e) => setCleaningAck(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                              />
                              <span>
                                Please return this item clean and ready to rent. If
                                it&apos;s returned needing cleaning, a{" "}
                                {money(portal.retrieval_cleaning_fee ?? 7)} cleaning
                                fee will be deducted from your earnings.
                              </span>
                            </label>
                            {retrieveErr && (
                              <p className="text-[13px] text-blush-deep">
                                {retrieveErr}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => requestRetrieval(i.id)}
                                disabled={
                                  busyItem === i.id ||
                                  !holdStart ||
                                  !holdEnd ||
                                  !cleaningAck
                                }
                                className="flex-1 rounded-full bg-ink px-4 py-3 text-[14px] text-cream disabled:opacity-40"
                              >
                                {busyItem === i.id ? "Sending…" : "Request these dates"}
                              </button>
                              <button
                                onClick={() => {
                                  setRetrievingId(null);
                                  setRetrieveErr("");
                                  setRetrieveNote("");
                                  setHoldStart("");
                                  setHoldEnd("");
                                  setCleaningAck(false);
                                }}
                                className="rounded-full border border-ink/20 px-4 py-3 text-[14px] text-ink/60"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : canRequest ? (
                          <button
                            onClick={() => {
                              setRetrievingId(i.id);
                              setRetrieveErr("");
                              setRetrieveNote("");
                              setHoldStart("");
                              setHoldEnd("");
                              setCleaningAck(false);
                            }}
                            className="text-[13px] font-medium text-ink/70 underline underline-offset-2"
                          >
                            Request this piece back
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Earnings history */}
          <h2 className="mt-8 font-serif text-2xl font-medium">Earnings</h2>
          {nextReturn && (
            <p className="mt-1 text-[13px] text-ink/55">
              {dep?.active
                ? `Your next payout is expected around ${fmtShort(nextReturn.due)}, when ${nextReturn.brand} comes back. Payouts land in your bank automatically within 3-5 business days of each return.`
                : `Your next earnings arrive around ${fmtShort(nextReturn.due)}, when ${nextReturn.brand} comes back. Set up direct deposit above so they can reach your bank.`}
            </p>
          )}
          <div className="mt-3 space-y-1.5">
            {portal.earnings && portal.earnings.length > 0 ? (
              portal.earnings.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-[14px]"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium">{e.brand}</span>{" "}
                    <span className="text-ink/45">rented</span>
                  </span>
                  <span className="shrink-0 pl-3">
                    <span className="font-medium">{money(e.amount)}</span>{" "}
                    <span className="text-ink/45">· {fmtShort(e.date)}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink/45">
                No earnings yet. As soon as one of your pieces rents and comes
                back, you&apos;ll see it here.
              </p>
            )}
          </div>

          {/* Payouts */}
          {portal.payouts.length > 0 && (
            <>
              <h2 className="mt-8 font-serif text-2xl font-medium">
                Payout history
              </h2>
              <div className="mt-3 space-y-1.5">
                {portal.payouts.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl bg-white/70 px-4 py-2.5 text-[14px]"
                  >
                    <span>
                      {money(p.amount)}
                      {p.method && (
                        <span className="text-ink/50"> · {p.method}</span>
                      )}
                    </span>
                    <span className="text-ink/45">{fmtShort(p.paid_at)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
