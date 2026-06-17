"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  booked: { start_date: string; due_date: string }[];
};

type Portal = {
  name: string;
  items: PortalItem[];
  payouts: { amount: string | number; method: string | null; paid_at: string }[];
  earned: number;
  paid: number;
  owed: number;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  available: { label: "On the rack", cls: "bg-sage" },
  reserved: { label: "Reserved", cls: "bg-lavender" },
  rented: { label: "Rented out", cls: "bg-blush" },
  cleaning: { label: "Being cleaned", cls: "bg-butter" },
  retired: { label: "Returned to you", cls: "bg-ink/10 text-ink/60" },
};

function money(n: number | string): string {
  const v = Number(n);
  return `$${v % 1 === 0 ? v : v.toFixed(2)}`;
}

export default function PortalPage() {
  const [code, setCode] = useState("");
  const [portal, setPortal] = useState<Portal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function login(c: string) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPortal(data);
      localStorage.setItem("borrow_portal_code", c.trim().toUpperCase());
    } else {
      setError(data.error || "That didn't work — try again.");
      localStorage.removeItem("borrow_portal_code");
    }
    setBusy(false);
  }

  useEffect(() => {
    // A code in the URL (?code=ABC123, e.g. from the "your piece rented" email)
    // logs the consignor straight in; otherwise fall back to a saved code.
    const fromUrl = new URLSearchParams(window.location.search)
      .get("code")
      ?.trim()
      .toUpperCase();
    const saved = localStorage.getItem("borrow_portal_code");
    const initial = fromUrl || saved;
    if (initial) {
      setCode(initial);
      login(initial);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function logout() {
    localStorage.removeItem("borrow_portal_code");
    setPortal(null);
    setCode("");
  }

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

      {!portal ? (
        <div className="mx-auto mt-12 max-w-sm text-center">
          <h1 className="font-serif text-3xl font-medium">
            Check on your pieces
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/55">
            Enter the access code BORROW gave you to see your closet, what
            it&apos;s earned, and what&apos;s headed your way.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) login(code);
            }}
            className="mt-6 space-y-3"
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ACCESS CODE"
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full rounded-full border border-ink/15 bg-white px-5 py-3.5 text-center text-base tracking-[0.25em] outline-none focus:border-ink/40"
            />
            {error && <p className="text-sm text-blush-deep">{error}</p>}
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="w-full rounded-full bg-ink px-5 py-3.5 text-base text-cream disabled:opacity-40"
            >
              {busy ? "One sec…" : "See my closet"}
            </button>
          </form>
          <p className="mt-4 text-[13px] text-ink/45">
            Don&apos;t have a code? Text BORROW — consigning takes five
            minutes and you keep 60% of every rental.
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

          {/* Money */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                Earned
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {money(portal.earned)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 text-center">
              <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                Paid out
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {money(portal.paid)}
              </p>
            </div>
            <div
              className={`rounded-2xl p-4 text-center ${portal.owed > 0 ? "bg-butter" : "bg-white"}`}
            >
              <p className="text-[11px] uppercase tracking-[0.15em] text-ink/45">
                Coming to you
              </p>
              <p className="mt-1 font-serif text-2xl font-semibold">
                {money(portal.owed)}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[13px] text-ink/45">
            You earn 60% of every completed rental. Payouts come straight from
            BORROW.
          </p>

          {/* Pieces */}
          <h2 className="mt-8 font-serif text-2xl font-medium">
            Your closet ({portal.items.length})
          </h2>
          <div className="mt-3 space-y-2">
            {portal.items.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-ink/45">
                No pieces in the program yet.
              </p>
            ) : (
              portal.items.map((i) => {
                const s = STATUS_LABEL[i.status] ?? STATUS_LABEL.available;
                return (
                  <div
                    key={i.id}
                    className="flex items-center gap-3 rounded-2xl bg-white p-3"
                  >
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
                );
              })
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

      <footer className="mt-16 pb-6 text-center text-[12px] uppercase tracking-[0.25em] text-ink/35">
        <Link href="/">← Back to the closet</Link>
      </footer>
    </main>
  );
}
