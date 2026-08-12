"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/client";

const OPS_EMAIL = "solarcouple@gmail.com";

type Mode = "signin" | "create" | "forgot";

function initialError(code: string | null) {
  if (code === "dispatcher_required") {
    return "Signed in, but this account is not a dispatcher yet. In Supabase, set rr_profiles.role to admin or dispatcher for your user.";
  }
  if (code === "admin_email_required") {
    return "Signed in, but your email is not on the ADMIN_EMAILS allowlist on Vercel.";
  }
  if (code === "driver_required") {
    return "Signed in, but this account is not a driver.";
  }
  if (code === "merchant_required") {
    return "Signed in, but this account is not a merchant. Register from Sell (/shop).";
  }
  if (code === "auth_callback") {
    return "That email link expired or was already used. Request a new password link below.";
  }
  return null;
}

export default function LoginClient() {
  const params = useSearchParams();
  const next = params.get("next") || "/admin/signups";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState(
    next.includes("/merchant") ? "" : OPS_EMAIL,
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    initialError(params.get("error")),
  );
  const [pending, startTransition] = useTransition();

  const isMerchantLogin = next.includes("/merchant");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      try {
        const supabase = createClient();
        const trimmed = email.trim().toLowerCase();

        if (mode === "forgot") {
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/login/set-password")}`;
          const { error: err } = await supabase.auth.resetPasswordForEmail(
            trimmed,
            { redirectTo },
          );
          if (err) throw err;
          setMessage(
            "Check your email for a link. Open it, then choose a password on the next screen.",
          );
          return;
        }

        if (mode === "create") {
          if (password.length < 8) {
            setError("Use at least 8 characters.");
            return;
          }
          if (password !== confirm) {
            setError("Passwords do not match.");
            return;
          }
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
          const { data, error: err } = await supabase.auth.signUp({
            email: trimmed,
            password,
            options: { emailRedirectTo: redirectTo },
          });
          if (err) throw err;
          if (data.session) {
            window.location.assign(next);
            return;
          }
          setMessage(
            "Account created. If Supabase asks you to confirm email, open that message — then sign in here. Or use “Email me a password link” below.",
          );
          setMode("signin");
          return;
        }

        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: trimmed,
          password,
        });
        if (err) throw err;
        if (!data.session) throw new Error("No session returned from Supabase.");
        window.location.assign(next);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Try again.",
        );
      }
    });
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          {isMerchantLogin
            ? "Merchant login"
            : mode === "create"
              ? "Create a password"
              : mode === "forgot"
                ? "Get a password link"
                : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isMerchantLogin ? (
            <>
              Business email from Sell registration. Need an account?{" "}
              <a className="font-medium text-black underline" href="/shop">
                Register your shop
              </a>
              .
            </>
          ) : mode === "create" ? (
            <>
              First time for Village Ride ops? Prefer{" "}
              <strong className="text-slate-900">{OPS_EMAIL}</strong>. This
              Supabase project is shared with your other app — if that email
              already exists, use &quot;Email me a password link&quot; or sign
              in with the password that works on the other app.
            </>
          ) : mode === "forgot" ? (
            <>
              We email a link that must open on{" "}
              <strong className="text-slate-900">village-ride.vercel.app</strong>
              , not your other app. In Supabase → Authentication → URL
              Configuration, add this to Redirect URLs:{" "}
              <code className="text-xs">
                https://village-ride.vercel.app/auth/callback
              </code>
              . Or set the password under Authentication → Users (no email
              needed).
            </>
          ) : (
            <>
              Your Supabase user is signed up with{" "}
              <strong className="text-slate-900">Google</strong> (same as
              TenderMatch). Use Google below — a typed password often won&apos;t
              work until you set one in Supabase Users.
            </>
          )}
        </p>

        {!isMerchantLogin && mode === "signin" ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setMessage(null);
              startTransition(async () => {
                try {
                  const supabase = createClient();
                  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
                  const { error: err } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo },
                  });
                  if (err) throw err;
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Google sign-in failed.",
                  );
                }
              });
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-bold text-slate-900 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {pending ? "Opening Google…" : "Continue with Google"}
          </button>
        ) : null}

        {!isMerchantLogin && mode === "signin" ? (
          <p className="mt-4 text-center text-xs font-medium tracking-wide text-slate-400 uppercase">
            or email password
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="ru-card mt-4 space-y-4 p-5">
          <label className="block text-sm">
            Email
            <input
              type="email"
              autoComplete="username"
              required
              className="ru-input mt-1 font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isMerchantLogin ? "you@yourshop.co.za" : OPS_EMAIL}
            />
          </label>

          {mode !== "forgot" ? (
            <label className="block text-sm">
              {mode === "create" ? "Choose a password" : "Password"}
              <input
                type="password"
                autoComplete={
                  mode === "create" ? "new-password" : "current-password"
                }
                required
                minLength={mode === "create" ? 8 : undefined}
                className="ru-input mt-1 font-mono"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "create" ? "At least 8 characters" : "Your password"
                }
              />
            </label>
          ) : null}

          {mode === "create" ? (
            <label className="block text-sm">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="ru-input mt-1 font-mono"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          ) : null}

          {error ? (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary w-full"
          >
            {pending
              ? "Please wait…"
              : mode === "create"
                ? "Create password & continue"
                : mode === "forgot"
                  ? "Email me a password link"
                  : isMerchantLogin
                    ? "Sign in to dashboard"
                    : "Sign in"}
          </button>
        </form>

        {!isMerchantLogin ? (
          <div className="mt-4 space-y-2 text-center text-sm text-slate-600">
            {mode !== "signin" ? (
              <button
                type="button"
                className="font-semibold text-black underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMessage(null);
                }}
              >
                Back to sign in
              </button>
            ) : (
              <>
                <p>
                  <button
                    type="button"
                    className="font-semibold text-black underline"
                    onClick={() => {
                      setMode("create");
                      setError(null);
                      setMessage(null);
                    }}
                  >
                    Create a password
                  </button>
                  {" · "}
                  <button
                    type="button"
                    className="font-semibold text-black underline"
                    onClick={() => {
                      setMode("forgot");
                      setError(null);
                      setMessage(null);
                    }}
                  >
                    Email me a password link
                  </button>
                </p>
                <p className="text-xs text-slate-500">
                  Or in Supabase → Authentication → Users → add{" "}
                  {OPS_EMAIL} with a password.
                </p>
              </>
            )}
          </div>
        ) : null}

        <p className="mt-6 text-center text-xs text-slate-500">
          <Link href="/" className="underline">
            Back home
          </Link>
        </p>
      </main>
    </>
  );
}
