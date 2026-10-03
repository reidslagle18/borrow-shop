"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteFooter from "@/components/SiteFooter";
import { fmtShort } from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-base outline-none focus:border-ink/40";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.18em] text-ink/50";

type AccountRental = {
  id: number;
  start_date: string;
  due_date: string;
  returned_date: string | null;
  status: string;
  rental_price: string | number;
  damage_waiver: boolean;
  cleaning_fee: string | number | null;
  late_fee: string | number;
  brand: string;
  size: string;
  color: string | null;
  photo_url: string | null;
};

type ConsignItem = {
  id: string;
  brand: string;
  size: string;
  color: string | null;
  rental_price: string | number;
  photo_url: string | null;
  status: string;
  approval_status?: string | null;
  rental_count: number;
  earned: number;
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

type Account = {
  name: string;
  email: string | null;
  phone: string | null;
  store_credit?: number;
  rentals: AccountRental[];
  consignment: {
    rate?: number; // locked commission %
    items: ConsignItem[];
    payouts: { amount: string | number; method: string | null; paid_at: string }[];
    pending_approvals?: PendingApproval[];
    direct_deposit?: {
      active: boolean;
      started: boolean;
      action_needed?: boolean;
      verifying?: boolean;
    };
    earned: number;
    paid: number;
    owed: number;
  } | null;
};

const ITEM_STATUS: Record<string, { label: string; cls: string }> = {
  available: { label: "On the rack", cls: "bg-sage" },
  reserved: { label: "Reserved", cls: "bg-lavender" },
  rented: { label: "Rented out", cls: "bg-blush" },
  // Customers just see "Reserved" for a consignor hold — never the internal status.
  consignor_hold: { label: "Reserved", cls: "bg-lavender" },
  cleaning: { label: "Being cleaned", cls: "bg-butter" },
  retired: { label: "Returned to you", cls: "bg-ink/10 text-ink/60" },
};

const RENTAL_STATUS: Record<string, { label: string; cls: string }> = {
  reserved: { label: "reserved", cls: "bg-lavender" },
  active: { label: "out with you", cls: "bg-blush" },
  completed: { label: "returned", cls: "bg-sage" },
};

function money(n: number | string): string {
  const v = Number(n);
  return `$${v % 1 === 0 ? v : v.toFixed(2)}`;
}

function Thumb({ url, brand }: { url: string | null; brand: string }) {
  return (
    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-lavender/40">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full items-center justify-center font-serif italic text-ink/30">
          {brand.charAt(0)}
        </div>
      )}
    </div>
  );
}

function RentalRow({ r }: { r: AccountRental }) {
  const s = RENTAL_STATUS[r.status] ?? RENTAL_STATUS.reserved;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
      <Thumb url={r.photo_url} brand={r.brand} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px]">
          <span className="font-serif font-semibold">{r.brand}</span>{" "}
          <span className="text-ink/50">
            {r.size}
            {r.color ? ` · ${r.color}` : ""}
          </span>
        </p>
        <p className="truncate text-[13px] text-ink/55">
          {fmtShort(r.start_date)} – {fmtShort(r.due_date)} ·{" "}
          {money(
            Number(r.rental_price) +
              (Number(r.cleaning_fee) || (r.damage_waiver ? 5 : 0))
          )}
          {Number(r.late_fee) > 0 && ` · ${money(r.late_fee)} late fee`}
        </p>
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${s.cls}`}>
        {s.label}
      </span>
    </div>
  );
}

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [account, setAccount] = useState<Account | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [disputingId, setDisputingId] = useState<string | null>(null);
  const [disputeValue, setDisputeValue] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [disputeErr, setDisputeErr] = useState("");

  // Consignor identity for approvals = the account's own email + phone (which is
  // how the consignment closet is matched to a consignor).
  async function refresh() {
    const token = localStorage.getItem("borrow_account_token");
    if (token) await loadAccount(token);
  }
  async function approveItem(itemId: string) {
    setBusyItem(itemId);
    try {
      await fetch("/api/portal-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: account?.email,
          phone: account?.phone,
          item_id: itemId,
          action: "approve",
        }),
      });
      await refresh();
    } finally {
      setBusyItem(null);
    }
  }
  async function submitDispute(itemId: string) {
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
          email: account?.email,
          phone: account?.phone,
          item_id: itemId,
          action: "dispute",
          suggested_value: suggested,
          note: disputeNote.trim() || null,
        }),
      });
      setDisputingId(null);
      setDisputeValue("");
      setDisputeNote("");
      await refresh();
    } finally {
      setBusyItem(null);
    }
  }

  const [depositBusy, setDepositBusy] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  // Send the consignor to Stripe onboarding (same flow the portal uses).
  async function setupDeposit() {
    setDepositBusy(true);
    setDepositMsg("");
    try {
      const res = await fetch("/api/connect-onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account?.email, phone: account?.phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      setDepositMsg(data.error || "Couldn't start setup, try again.");
    } catch {
      setDepositMsg("We couldn't reach BORROW. Check your connection and try again.");
    }
    setDepositBusy(false);
  }

  async function loadAccount(token: string): Promise<boolean> {
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "me", token }),
      });
      if (res.ok) {
        setAccount(await res.json());
        return true;
      }
      localStorage.removeItem("borrow_account_token");
      return false;
    } catch {
      // Network hiccup: keep the token so a refresh can recover the session.
      setError("We couldn't load your account. Check your connection and refresh.");
      return false;
    }
  }

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("signup")) {
      setMode("signup");
    }
    const token = localStorage.getItem("borrow_account_token");
    if (token) {
      loadAccount(token).finally(() => setCheckingSession(false));
    } else {
      setCheckingSession(false);
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) {
      setError("Please enter your first and last name.");
      return;
    }
    setBusy(true);
    setError("");
    try {
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "signup"
          ? {
              action: "signup",
              name: `${firstName.trim()} ${lastName.trim()}`,
              email,
              phone,
            }
          : { action: "login", email, phone }
      ),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      localStorage.setItem("borrow_account_token", data.token);
      localStorage.setItem(
        "borrow_profile",
        JSON.stringify({ name: data.name, email: data.email, phone: data.phone })
      );
      await loadAccount(data.token);
    } else {
      setError(data.error || "That didn't work, try again.");
      if (res.status === 409) setMode("login");
    }
    } catch {
      setError("We couldn't reach BORROW. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("borrow_account_token");
    localStorage.removeItem("borrow_profile");
    setAccount(null);
  }

  const upcoming =
    account?.rentals.filter((r) => r.status !== "completed") ?? [];
  const past = account?.rentals.filter((r) => r.status === "completed") ?? [];

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="text-center">
        <Link href="/" className="font-serif text-4xl italic font-medium">
          BORROW
        </Link>
        <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-ink/45">
          Your account
        </p>
      </div>

      {checkingSession ? (
        <div className="mx-auto mt-12 max-w-sm">
          <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
        </div>
      ) : !account ? (
        <div className="mx-auto mt-10 max-w-sm">
          <div className="flex rounded-full bg-white p-1">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 rounded-full py-2.5 text-[15px] ${
                mode === "login" ? "bg-ink text-cream" : "text-ink/55"
              }`}
            >
              Log in
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`flex-1 rounded-full py-2.5 text-[15px] ${
                mode === "signup" ? "bg-ink text-cream" : "text-ink/55"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            {mode === "signup" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First name</label>
                  <input
                    className={inputCls}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Last name</label>
                  <input
                    className={inputCls}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>
            )}
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            {error && <p className="text-sm text-blush-deep">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-ink px-5 py-3.5 text-base text-cream disabled:opacity-40"
            >
              {busy
                ? "One sec…"
                : mode === "signup"
                  ? "Create my account"
                  : "Log in"}
            </button>
          </form>
          <p className="mt-4 text-center text-[13px] leading-relaxed text-ink/45">
            {mode === "signup"
              ? "An account lets you book faster and makes you eligible to consign, and you keep 20% of every rental your pieces earn."
              : "Log in with the email and phone number you signed up with."}
          </p>
        </div>
      ) : (
        <div className="mt-10">
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-3xl font-medium">
              Hi, {account.name.split(" ")[0]}.
            </h1>
            <button
              onClick={logout}
              className="text-[13px] text-ink/45 underline underline-offset-2"
            >
              Log out
            </button>
          </div>

          {/* Pops up on login: consignor has items to review */}
          {account.consignment?.pending_approvals &&
            account.consignment.pending_approvals.length > 0 && (
              <a
                href="#review"
                className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-butter-deep/40 bg-butter/60 px-4 py-3.5 transition-colors hover:bg-butter/80"
              >
                <span className="text-[14px] font-medium leading-snug">
                  You have {account.consignment.pending_approvals.length} item
                  {account.consignment.pending_approvals.length === 1 ? "" : "s"}{" "}
                  awaiting your review in your Consignor Studio.
                </span>
                <span className="shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] text-cream">
                  Review now
                </span>
              </a>
            )}

          {account.store_credit != null && account.store_credit > 0 && (
            <div className="mt-5 rounded-2xl bg-sage/30 p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                Store credit
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {money(account.store_credit)}
              </p>
              <p className="mt-1 text-[13px] text-ink/55">
                Applied automatically at your next checkout.
              </p>
            </div>
          )}

          {/* Account details */}
          <div className="mt-5 rounded-2xl bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
              Account details
            </p>
            <div className="mt-2 grid gap-y-1 text-[14px] sm:grid-cols-2">
              <p>
                <span className="text-ink/45">Name</span>{" "}
                <span className="font-medium">{account.name}</span>
              </p>
              {account.email && (
                <p className="truncate">
                  <span className="text-ink/45">Email</span>{" "}
                  <span className="font-medium">{account.email}</span>
                </p>
              )}
              {account.phone && (
                <p>
                  <span className="text-ink/45">Phone</span>{" "}
                  <span className="font-medium">{account.phone}</span>
                </p>
              )}
            </div>
            <p className="mt-2 text-[12px] text-ink/45">
              Need to update these? DM @borrowfayetteville and we&apos;ll fix it.
            </p>
          </div>

          {/* Upcoming reservations */}
          <h2 className="mt-7 font-serif text-2xl font-medium">Upcoming</h2>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink/45">
                No upcoming reservations,{" "}
                <Link href="/" className="underline underline-offset-2">
                  go find your dress
                </Link>
                .
              </p>
            ) : (
              upcoming.map((r) => <RentalRow key={r.id} r={r} />)
            )}
          </div>

          {/* Rental history */}
          {past.length > 0 && (
            <>
              <h2 className="mt-7 font-serif text-2xl font-medium">
                Rental history
              </h2>
              <div className="mt-3 space-y-2">
                {past.map((r) => (
                  <RentalRow key={r.id} r={r} />
                ))}
              </div>
            </>
          )}

          {/* Consignment / Consignor Studio */}
          <h2
            id="review"
            className="mt-8 scroll-mt-6 font-serif text-2xl font-medium"
          >
            Your Consignor Studio
          </h2>
          {account.consignment ? (
            <>
              {/* Items Awaiting Your Review */}
              {account.consignment.pending_approvals &&
                account.consignment.pending_approvals.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-butter-deep/30 bg-butter/40 p-5">
                    <h3 className="font-serif text-xl font-medium">
                      Items Awaiting Your Review (
                      {account.consignment.pending_approvals.length})
                    </h3>
                    <p className="mt-1 text-[13px] text-ink/60">
                      Nothing is listed for rent until you approve it.
                    </p>
                    <div className="mt-4 space-y-3">
                      {account.consignment.pending_approvals.map((p) => {
                        const isDisputed = p.approval_status === "disputed";
                        return (
                          <div key={p.id} className="rounded-xl bg-white p-3">
                            <div className="flex gap-3">
                              <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-lavender/40">
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
                                <p className="mt-1 text-[12px] leading-relaxed text-ink/50">
                                  {APPROVAL_CONTEXT}
                                </p>
                              </div>
                            </div>

                            {!isDisputed && p.dispute_outcome === "accepted" && (
                              <p className="mt-2 rounded-lg bg-sage/40 px-3 py-2 text-[13px] leading-relaxed">
                                We updated the value to{" "}
                                {money(p.replacement_value ?? 0)} as you suggested.
                                Please confirm below.
                              </p>
                            )}
                            {!isDisputed && p.dispute_outcome === "rejected" && (
                              <p className="mt-2 rounded-lg bg-blush/25 px-3 py-2 text-[13px] leading-relaxed">
                                We reviewed your suggestion
                                {p.disputed_value
                                  ? ` of ${money(p.disputed_value)}`
                                  : ""}{" "}
                                and kept the value at{" "}
                                {money(p.replacement_value ?? 0)}. Please review it
                                again below.
                              </p>
                            )}

                            {isDisputed ? (
                              <p className="mt-2 rounded-lg bg-butter/60 px-3 py-2 text-[13px] leading-relaxed">
                                You suggested {money(p.disputed_value ?? 0)}. BORROW
                                is reviewing it, and we&apos;ll send it back for your
                                final approval.
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
                                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-base outline-none focus:border-ink/40"
                                />
                                <textarea
                                  value={disputeNote}
                                  onChange={(e) => setDisputeNote(e.target.value)}
                                  placeholder="Optional: a quick note on why (e.g. what you paid)"
                                  className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-ink/40"
                                  rows={2}
                                />
                                {disputeErr && (
                                  <p className="text-[13px] text-blush-deep">
                                    {disputeErr}
                                  </p>
                                )}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => submitDispute(p.id)}
                                    disabled={busyItem === p.id}
                                    className="flex-1 rounded-full bg-ink px-4 py-2.5 text-[15px] text-cream disabled:opacity-40"
                                  >
                                    {busyItem === p.id ? "…" : "Submit suggestion"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDisputingId(null);
                                      setDisputeErr("");
                                    }}
                                    className="rounded-full border border-ink/20 px-4 py-2.5 text-[15px] text-ink/60"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 flex gap-2">
                                <button
                                  onClick={() => approveItem(p.id)}
                                  disabled={busyItem === p.id}
                                  className="flex-1 rounded-full bg-ink px-4 py-2.5 text-[15px] text-cream disabled:opacity-40"
                                >
                                  {busyItem === p.id ? "…" : "Approve"}
                                </button>
                                <button
                                  onClick={() => {
                                    setDisputingId(p.id);
                                    setDisputeValue(
                                      String(p.replacement_value ?? "")
                                    );
                                    setDisputeNote("");
                                    setDisputeErr("");
                                  }}
                                  disabled={busyItem === p.id}
                                  className="flex-1 rounded-full border border-ink/20 px-4 py-2.5 text-[15px] text-ink/70 disabled:opacity-40"
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

              {/* Direct deposit status — always tells them exactly where things stand */}
              {account.consignment.direct_deposit && (
                <div className="mt-4 rounded-2xl bg-white p-4">
                  {account.consignment.direct_deposit.active ? (
                    <p className="text-[14px]">
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sage text-[11px]">
                        ✓
                      </span>
                      <span className="font-medium">Direct deposit is on.</span>{" "}
                      <span className="text-ink/55">
                        Your {account.consignment.rate ?? 60}% goes straight to
                        your bank after each rental.
                      </span>
                    </p>
                  ) : account.consignment.direct_deposit.verifying ? (
                    <p className="text-[14px]">
                      <span className="mr-2">⏳</span>
                      <span className="font-medium">
                        You&apos;re all set, we&apos;re verifying your details.
                      </span>{" "}
                      <span className="text-ink/55">
                        Nothing is needed from you; payouts start automatically
                        once verification finishes.
                      </span>
                    </p>
                  ) : (
                    <>
                      <p className="text-[14px] font-medium">
                        {account.consignment.direct_deposit.action_needed
                          ? "One quick step left to get paid"
                          : "Set up direct deposit to get paid automatically"}
                      </p>
                      <p className="mt-0.5 text-[13px] text-ink/55">
                        Takes about two minutes. Your earnings wait safely until
                        it&apos;s done.
                      </p>
                      <button
                        onClick={setupDeposit}
                        disabled={depositBusy}
                        className="mt-2.5 rounded-full bg-ink px-5 py-2.5 text-[14px] text-cream disabled:opacity-40"
                      >
                        {depositBusy
                          ? "One sec…"
                          : account.consignment.direct_deposit.started
                            ? "Finish direct deposit setup"
                            : "Set up direct deposit"}
                      </button>
                      {depositMsg && (
                        <p className="mt-2 text-[13px] text-blush-deep">{depositMsg}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                    Earned
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">
                    {money(account.consignment.earned)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-center">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                    Paid out
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">
                    {money(account.consignment.paid)}
                  </p>
                </div>
                <div
                  className={`rounded-2xl p-4 text-center ${
                    account.consignment.owed > 0 ? "bg-butter" : "bg-white"
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                    Coming to you
                  </p>
                  <p className="mt-1 font-serif text-2xl font-semibold">
                    {money(account.consignment.owed)}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-[13px] text-ink/45">
                You earn {account.consignment.rate ?? 60}% of every completed rental.
              </p>
              <div className="mt-3 space-y-2">
                {account.consignment.items.map((i) => {
                  const s =
                    i.approval_status === "pending"
                      ? { label: "Awaiting your approval", cls: "bg-butter" }
                      : i.approval_status === "disputed"
                        ? { label: "Disputed", cls: "bg-blush/50" }
                        : ITEM_STATUS[i.status] ?? ITEM_STATUS.available;
                  return (
                    <div
                      key={i.id}
                      className="flex items-center gap-3 rounded-2xl bg-white p-3"
                    >
                      <Thumb url={i.photo_url} brand={i.brand} />
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
                  );
                })}
              </div>
              {account.consignment.payouts.length > 0 && (
                <>
                  <h3 className="mt-6 font-serif text-xl font-medium">
                    Payout history
                  </h3>
                  <div className="mt-2 space-y-1.5">
                    {account.consignment.payouts.map((p, idx) => (
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
                        <span className="text-ink/45">
                          {fmtShort(p.paid_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="mt-3 rounded-2xl bg-lavender/30 p-5">
              <p className="font-serif text-xl font-medium">
                Your closet could be earning.
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                Having an account makes you eligible to consign. Bring us the
                dresses you never reach for, and we photograph, list, rent, and
                clean them, and you keep 20% of every rental. DM
                @borrowfayetteville on Instagram or stop by the studio to get
                your pieces on the rack, and they&apos;ll show up right here.
              </p>
            </div>
          )}
        </div>
      )}

      <SiteFooter />
    </main>
  );
}
