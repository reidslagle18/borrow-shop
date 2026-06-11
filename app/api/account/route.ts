import { NextResponse } from "next/server";

const PATHS: Record<string, string> = {
  signup: "/api/public/signup",
  login: "/api/public/account-login",
  me: "/api/public/account",
};

/** Proxies account actions to the studio — the API key stays server-side. */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  if (!base || !key) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const b = await request.json();
  const path = PATHS[b.action as string];
  if (!path) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify(b),
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
