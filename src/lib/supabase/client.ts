import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anon,
  );
}
