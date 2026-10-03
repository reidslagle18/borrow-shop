import { NextResponse } from "next/server";

/** Proxies a consignor's "request my piece back" action; key stays server-side. */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const b = await request.json();
  try {
    const res = await fetch(`${base}/api/public/consignor-retrieval`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        email: b.email,
        phone: b.phone,
        code: b.code,
        item_id: b.item_id,
        note: b.note,
        hold_start: b.hold_start,
        hold_end: b.hold_end,
        cleaning_ack: b.cleaning_ack,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Couldn't reach BORROW, try again" }, { status: 502 });
  }
}
