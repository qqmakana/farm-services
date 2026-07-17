"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/client";

const OPS_EMAIL = "solarcouple@gmail.com";

export default function LoginClient() {
  const params = useSearchParams();
  const next = params.get("next") || "/dispatch";
  const [email, setEmail] = useState(OPS_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "dispatcher_required"
      ? "Signed in, but this account is not a dispatcher yet. Run FIX_PROFILES_RLS.sql then try again."
      : null,
  );
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const supabase = createClient();
        const { data, error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        if (!data.session) throw new Error("No session returned from Supabase.");

        // Hard navigate so auth cookies are sent to middleware
        window.location.assign(next);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Login failed. Check email and password.",
        );
      }
    });
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Ops login
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Owner Dispatch login. Public customer email stays{" "}
          <a
            className="font-medium text-[var(--ru-brand)]"
            href="mailto:ai@sandtonstreets.com"
          >
            ai@sandtonstreets.com
          </a>
          .
        </p>

        <form onSubmit={onSubmit} className="ru-card mt-6 space-y-4 p-5">
          <label className="block text-sm">
            Email
            <input
              type="text"
              autoComplete="username"
              required
              className="ru-input mt-1 font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Password (visible)
            <input
              type="text"
              autoComplete="current-password"
              required
              className="ru-input mt-1 font-mono"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Paste your ops password"
            />
          </label>
          {error && (
            <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary w-full"
          >
            {pending ? "Signing in…" : "Sign in to Dispatch"}
          </button>
        </form>
      </main>
    </>
  );
}
