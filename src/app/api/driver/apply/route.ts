import { NextResponse } from "next/server";
import { submitDriverApplication } from "@/lib/driver-apply";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Driver signup with photos — JSON API (avoids Server Action digest errors).
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await submitDriverApplication(formData);
    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Application failed. Please try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
