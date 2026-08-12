import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles magic / recovery links from Supabase Auth emails.
 * Example: /auth/callback?code=...&next=/login/set-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/admin/signups";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL(`/login?error=auth_callback&next=${encodeURIComponent(next)}`, origin),
  );
}
