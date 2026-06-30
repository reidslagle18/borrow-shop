import { NextResponse } from "next/server";

/**
 * Proxies a consignor's direct-deposit (Stripe Connect) onboarding request.
 * The API key stays server-side; return/refresh URLs point back to the portal.
 */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const b = await request.json();
  const origin = new URL(request.url).origin;
  try {
    const res = await fetch(`${base}/api/public/connect-onboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        email: b.email,
        phone: b.phone,
        code: b.code,
        return_url: `${origin}/portal?deposit=done`,
        refresh_url: `${origin}/portal?deposit=refresh`,
      }),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach BORROW — try again" },
      { status: 502 }
    );
  }
}
