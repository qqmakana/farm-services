import { createClient } from "@supabase/supabase-js";

function looksLikePlaceholder(value: string) {
  const v = value.trim().toLowerCase();
  return (
    !v ||
    v.includes("your_") ||
    v.includes("your.") ||
    v.startsWith("your") ||
    v.includes("example") ||
    v.includes("[your-password]")
  );
}

function getSecretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

/** Server-only. Bypasses RLS for matching, webhooks, job create. Never import in client components. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getSecretKey();
  if (!url || !key || looksLikePlaceholder(url) || looksLikePlaceholder(key)) {
    throw new Error(
      "Add SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY / sb_secret_…) to .env.local.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasServiceRole() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const key = getSecretKey();
  if (looksLikePlaceholder(url) || looksLikePlaceholder(key)) return false;
  if (!url.startsWith("https://")) return false;
  if (key.length < 20) return false;
  return true;
}
