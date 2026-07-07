import { NextResponse } from "next/server";

/** Proxies the studio's public config (cleaning fee + sales tax rate). */
export async function GET() {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${base}/api/public/config`, {
      headers: { "x-api-key": key },
      cache: "no-store",
    });
    return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
