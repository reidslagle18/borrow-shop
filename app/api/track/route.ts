import { NextResponse } from "next/server";

/**
 * Records a product view ("click") to the studio, which drives the shop's
 * default "Most loved" sort. Best-effort and fail-silent — tracking must never
 * affect the shopper's experience.
 */
export async function POST(request: Request) {
  const base = process.env.ADMIN_API_BASE;
  const key = process.env.BOOKING_API_KEY;
  const b = await request.json().catch(() => ({}));
  const itemId = typeof b?.item_id === "string" ? b.item_id : null;
  if (base && key && itemId) {
    try {
      await fetch(`${base}/api/public/click`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": key },
        body: JSON.stringify({ item_id: itemId }),
      });
    } catch {
      /* ignore — popularity tracking is non-critical */
    }
  }
  return NextResponse.json({ ok: true });
}
