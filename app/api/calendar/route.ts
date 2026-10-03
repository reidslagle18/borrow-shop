import { NextResponse } from "next/server";

/** JSON booking feed for the /calendar page (proxies the studio, key stays server-side). */
export async function GET() {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) return NextResponse.json({ bookings: [] });
  try {
    const res = await fetch(`${base}/api/public/calendar`, {
      headers: { "x-api-key": key },
      cache: "no-store",
    });
    return NextResponse.json(await res.json().catch(() => ({ bookings: [] })), { status: res.status });
  } catch {
    return NextResponse.json({ bookings: [] }, { status: 502 });
  }
}
