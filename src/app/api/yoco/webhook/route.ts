import { NextResponse } from "next/server";

/**
 * Yoco payment notification. Job/order create still happens on /yoco/complete
 * after GET checkout confirms status=completed. This route acknowledges events.
 */
export async function POST(request: Request) {
  const text = await request.text();
  if (process.env.NODE_ENV !== "production") {
    console.info("[yoco webhook]", text.slice(0, 400));
  }
  return NextResponse.json({ received: true });
}
