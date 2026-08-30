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
    return "Signed in, but this account is not a shop owner. Register at /merchant/register.";
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
      <SiteNav compact />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          {isMerchantLogin
            ? "Shop owner login"
            : mode === "create"
              ? "Create a password"
              : mode === "forgot"
                ? "Get a password link"
                : "Sign in"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isMerchantLogin ? (
            <>
              Shop email from registration. Need an account?{" "}
              <a className="font-medium text-black underline" href="/merchant/register">
                Register your shop
              </a>
              .
            </>
          ) : mode === "create" ? (
            <>
              First time? Choose an email and password. If the email already
              exists, use &quot;Email me a password link&quot; instead — or set
              the password in Supabase → Authentication → Users.
            </>
          ) : mode === "forgot" ? (
            <>
              We&apos;ll email a link to set a new password. The link should open
              on village-ride.vercel.app.
            </>
          ) : (
            <>
              Ops or merchant login with email and password. Riders and drivers
              do not need this page — use the app home or Drive signup.
            </>
          )}
        </p>

        <form onSubmit={onSubmit} className="ru-card mt-6 space-y-4 p-5">
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
                    ? "Sign in to kitchen"
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
