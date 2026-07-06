"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "borrow_marketing_seen";

/**
 * Lightweight marketing opt-in. Shows once per visitor — after ~10s or on exit
 * intent, whichever comes first — and never again after submit/dismiss (stored
 * in localStorage). Saves to the shared customers list via /api/account.
 */
export default function MarketingPopup() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {
      return;
    }
    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      cleanup();
    };
    const timer = window.setTimeout(show, 10000);
    // Exit intent: cursor leaves the top of the viewport (desktop).
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    document.addEventListener("mouseout", onMouseOut);
    function cleanup() {
      window.clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
    }
    return cleanup;
  }, []);

  function markSeen() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* private mode — fine */
    }
  }

  function dismiss() {
    markSeen();
    setOpen(false);
  }

  const hasPhone = phone.replace(/\D/g, "").length >= 7;

  async function submit() {
    setError("");
    if (!email.trim() || !email.includes("@")) return setError("Please add a valid email.");
    if (hasPhone && !consent) return setError("Please agree to the texting terms to include your number.");
    setBusy(true);
    const res = await fetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "marketing",
        name: name.trim(),
        email: email.trim(),
        phone: hasPhone ? phone.trim() : "",
        sms_consent: hasPhone && consent,
      }),
    });
    if (res.ok) {
      markSeen();
      setDone(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Couldn't sign you up — try again.");
    }
    setBusy(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6"
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-cream p-7 shadow-xl sm:rounded-3xl sm:p-9"
        style={{ background: "linear-gradient(180deg,#fffdf0,#f7f4ef)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-ink/45 hover:bg-ink/5"
        >
          ×
        </button>

        {done ? (
          <div className="py-4 text-center">
            <p className="font-serif text-5xl italic text-sage-deep">✓</p>
            <h2 className="mt-3 font-serif text-3xl font-medium">You&apos;re on the list</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/60">
              We&apos;ll send you first looks at new arrivals. See you in your inbox.
            </p>
            <button
              onClick={dismiss}
              className="mt-6 rounded-full bg-ink px-7 py-3 text-[15px] text-cream"
            >
              Start browsing
            </button>
          </div>
        ) : (
          <>
            <p className="text-[11px] uppercase tracking-[0.3em] text-blush-deep">Borrow</p>
            <h2 className="mt-2 font-serif text-3xl font-medium leading-tight">
              First dibs on the closet
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/60">
              Join the list for new arrivals, restocks, and the occasional perk.
              Add your number for text-only drops too.
            </p>

            <div className="mt-5 space-y-2.5">
              <input
                className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink/40"
                placeholder="First name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
              />
              <input
                type="email"
                className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink/40"
                placeholder="Email *"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <input
                type="tel"
                className="w-full rounded-xl border border-ink/15 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-ink/40"
                placeholder="Phone (optional — for texts)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>

            {hasPhone && (
              <label className="mt-3 flex items-start gap-2.5 text-[11px] leading-relaxed text-ink/55">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ink"
                />
                <span>
                  By submitting your number, you agree to receive recurring
                  automated marketing texts from Borrow at the number provided.
                  Consent is not a condition of purchase. Msg &amp; data rates may
                  apply. Msg frequency varies. Reply STOP to opt out, HELP for
                  help. See our{" "}
                  <a
                    href="https://borrowfayetteville.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Privacy Policy
                  </a>{" "}
                  and{" "}
                  <a
                    href="https://borrowfayetteville.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    Terms
                  </a>
                  .
                </span>
              </label>
            )}

            {error && <p className="mt-3 text-sm text-blush-deep">{error}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="mt-4 w-full rounded-full bg-ink px-6 py-3.5 text-base text-cream transition-opacity disabled:opacity-40"
            >
              {busy ? "Joining…" : "Join the list"}
            </button>
            <button
              onClick={dismiss}
              className="mt-2 w-full text-center text-[13px] text-ink/45"
            >
              No thanks
            </button>
          </>
        )}
      </div>
    </div>
  );
}
