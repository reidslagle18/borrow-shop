import { NextResponse } from "next/server";

/**
 * Server-side booking proxy — the BOOKING_API_KEY never reaches the browser.
 * The studio backend re-validates everything (price, double-booking) anyway.
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

  try {
    const res = await fetch(`${base}/api/public/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
      },
      body: JSON.stringify({
        item_id: b.item_id,
        start_date: b.start_date,
        due_date: b.due_date,
        damage_waiver: !!b.damage_waiver,
        notes: (b.notes || "").trim() || null,
        customer: {
          name,
          phone,
          email: (b.email || "").trim() || null,
        },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Couldn't book — try again" },
        { status: res.status === 409 ? 409 : 400 }
      );
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the booking system — try again" },
      { status: 502 }
    );
  }
}
