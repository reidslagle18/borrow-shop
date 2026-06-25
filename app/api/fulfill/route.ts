import { NextResponse } from "next/server";

/** Confirms a paid Checkout Session into a reservation (via the studio backend). */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const b = await request.json();
  if (!b.session_id) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${base}/api/public/fulfill`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({ session_id: b.session_id }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Couldn't confirm — try again" }, { status: 502 });
  }
}
