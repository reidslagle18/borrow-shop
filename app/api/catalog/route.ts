import { NextResponse } from "next/server";

/**
 * Server-side proxy to the studio's full-collection feed. Powers the view-only
 * Lookbook (/lookbook) — the whole collection, including pieces that can't be
 * rented right now. Nothing here can be booked; the Lookbook is browse-only.
 */
export async function GET() {
  const base = process.env.ADMIN_API_BASE;
  if (!base) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  try {
    const res = await fetch(`${base}/api/public/catalog`, {
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Couldn't load the collection" },
        { status: 502 }
      );
    }
    return NextResponse.json(await res.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't load the collection" },
      { status: 502 }
    );
  }
}
