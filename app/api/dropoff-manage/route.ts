import { NextResponse } from "next/server";

/** Proxies self-service drop-off management (view/cancel/reschedule) to the
 *  studio. The manage token identifies the appointment; the API key stays
 *  server-side. */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const body = await request.json();
  try {
    const res = await fetch(`${base}/api/public/dropoff-manage`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Couldn't reach BORROW, try again" }, { status: 502 });
  }
}
