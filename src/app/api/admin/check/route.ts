import { NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/admin-auth";

/** Lightweight check so SiteNav can hide Admin for non-admins. */
export async function GET() {
  const gate = await requireAdminAccess();
  return NextResponse.json({
    ok: gate.ok,
    email: gate.ok ? gate.email : null,
  });
}
