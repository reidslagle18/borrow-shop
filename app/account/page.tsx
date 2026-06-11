"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  rental_count: number;
  earned: number;
  booked: { start_date: string; due_date: string }[];
};

type Account = {
  name: string;
  email: string | null;
  phone: string | null;
  rentals: AccountRental[];
  consignment: {
    items: ConsignItem[];
    payouts: { amount: string | number; method: string | null; paid_at: string }[];
    earned: number;
    paid: number;
    owed: number;
  } | null;
};

const ITEM_STATUS: Record<string, { label: string; cls: string }> = {
  available: { label: "On the rack", cls: "bg-sage" },
  reserved: { label: "Reserved", cls: "bg-lavender" },
  rented: { label: "Rented out", cls: "bg-blush" },
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

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [account, setAccount] = useState<Account | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadAccount(token: string): Promise<boolean> {
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
    setBusy(true);
    setError("");
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "signup"
          ? { action: "signup", name, email, phone }
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
      setError(data.error || "That didn't work — try again.");
      if (res.status === 409) setMode("login");
    }
    setBusy(false);
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
              <div>
                <label className={labelCls}>Name</label>
                <input
                  className={inputCls}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
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
              ? "An account lets you book faster and makes you eligible to consign — you keep 60% of every rental your pieces earn."
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

          {/* Her rentals */}
          <h2 className="mt-7 font-serif text-2xl font-medium">Your rentals</h2>
          <div className="mt-3 space-y-2">
            {account.rentals.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink/45">
                Nothing yet —{" "}
                <Link href="/" className="underline underline-offset-2">
                  go find your dress
                </Link>
                .
              </p>
            ) : (
              [...upcoming, ...past].map((r) => {
                const s = RENTAL_STATUS[r.status] ?? RENTAL_STATUS.reserved;
                return (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3"
                  >
                    <Thumb url={r.photo_url} brand={r.brand} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px]">
                        <span className="font-serif font-semibold">
                          {r.brand}
                        </span>{" "}
                        <span className="text-ink/50">
                          {r.size}
                          {r.color ? ` · ${r.color}` : ""}
                        </span>
                      </p>
                      <p className="truncate text-[13px] text-ink/55">
                        {fmtShort(r.start_date)} – {fmtShort(r.due_date)} ·{" "}
                        {money(
                          Number(r.rental_price) + (r.damage_waiver ? 5 : 0)
                        )}
                        {Number(r.late_fee) > 0 &&
                          ` · ${money(r.late_fee)} late fee`}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Consignment */}
          <h2 className="mt-8 font-serif text-2xl font-medium">
            Your consignment closet
          </h2>
          {account.consignment ? (
            <>
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
                You earn 60% of every completed rental.
              </p>
              <div className="mt-3 space-y-2">
                {account.consignment.items.map((i) => {
                  const s = ITEM_STATUS[i.status] ?? ITEM_STATUS.available;
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
                dresses you never reach for — we photograph, list, rent, and
                clean them, and you keep 60% of every rental. Text BORROW or
                stop by the studio to get your pieces on the rack, and
                they&apos;ll show up right here.
              </p>
            </div>
          )}
        </div>
      )}

      <footer className="mt-16 pb-6 text-center text-[12px] uppercase tracking-[0.25em] text-ink/35">
        <Link href="/">← Back to the closet</Link>
      </footer>
    </main>
  );
}
