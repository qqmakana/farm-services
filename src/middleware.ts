import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

function supabaseAuthReady() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";
  if (!url || !anon) return false;
  if (/your[_-]?project|your\.|example|^http\./i.test(url)) return false;
  if (/your\.|your_|example/i.test(anon) || anon.length < 20) return false;
  if (!url.startsWith("https://")) return false;
  return true;
}

function getSecretKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ""
  );
}

async function getRoleForUser(userId: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secret = getSecretKey();
  if (!secret) return null;
  try {
    const admin = createClient(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data } = await admin
      .from("rr_profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    return data?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!supabaseAuthReady()) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  if (path.startsWith("/dispatch")) {
    if (!user) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      return NextResponse.redirect(login);
    }

    // Use service role for role check (avoids broken RLS recursion on rr_profiles)
    const role = await getRoleForUser(user.id);
    if (role !== "dispatcher" && role !== "admin") {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", path);
      login.searchParams.set("error", "dispatcher_required");
      return NextResponse.redirect(login);
    }
  }

  if (path === "/login" && user) {
    const role = await getRoleForUser(user.id);
    if (
      (role === "dispatcher" || role === "admin") &&
      !request.nextUrl.searchParams.get("stay")
    ) {
      const next = request.nextUrl.searchParams.get("next") || "/dispatch";
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dispatch/:path*", "/login"],
};
