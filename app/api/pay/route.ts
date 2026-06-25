import { NextResponse } from "next/server";

/**
 * Starts an online "pay to reserve" checkout: asks the studio backend for a
 * Stripe Checkout Session and returns its URL for the browser to redirect to.
 */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const b = await request.json();
  const name = (b.name || "").trim();
  const phone = (b.phone || "").trim();
  if (!b.item_id || !b.start_date || !b.due_date || !name || !phone) {
    return NextResponse.json(
      { error: "Name, phone, dress and dates are all required" },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  try {
    const res = await fetch(`${base}/api/public/checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        item_id: b.item_id,
        start_date: b.start_date,
        due_date: b.due_date,
        customer: { name, phone, email: (b.email || "").trim() || null },
        success_url: `${origin}/?reserved={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Couldn't start checkout — try again" },
        { status: res.status === 409 ? 409 : 400 }
      );
    }
    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the payment system — try again" },
      { status: 502 }
    );
  }
}
