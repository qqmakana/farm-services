import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function looksLikePlaceholder(value: string) {
  const v = value.trim().toLowerCase();
  return (
    !v ||
    v.includes("your_project") ||
    v.includes("your-project") ||
    v.includes("your.") ||
    v.includes("example") ||
    v === "http." ||
    v.startsWith("your")
  );
}

export async function createClient() {
  const cookieStore = await cookies();
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — middleware refreshes sessions.
          }
        },
      },
    },
  );
}

/** True only when a real Supabase project is configured (not placeholders). */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";
  if (looksLikePlaceholder(url) || looksLikePlaceholder(anon)) return false;
  if (!url.startsWith("https://")) return false;
  if (anon.length < 20) return false;
  return true;
}
