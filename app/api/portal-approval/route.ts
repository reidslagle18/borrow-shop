import { NextResponse } from "next/server";

/** Proxies a consignor's approve/dispute action; the API key stays server-side. */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const b = await request.json();
  try {
    const res = await fetch(`${base}/api/public/consignor-approval`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        email: b.email,
        phone: b.phone,
        code: b.code,
        item_id: b.item_id,
        action: b.action,
        suggested_value: b.suggested_value,
        note: b.note,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Couldn't reach BORROW, try again" }, { status: 502 });
  }
}
