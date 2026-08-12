"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/client";

/** After recovery email — choose a new password while signed in via the link. */
export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    start(async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setError(
            "Open the link from your email first, then come back here to set the password.",
          );
          return;
        }
        const { error: err } = await supabase.auth.updateUser({ password });
        if (err) throw err;
        setDone(true);
        setTimeout(() => router.push("/admin/signups"), 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save password");
      }
    });
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-3xl font-bold">Create your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a password for ops login (Signups, Dispatch, Admin).
        </p>
        {done ? (
          <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Saved — opening Signups…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="ru-card mt-6 space-y-4 p-5">
            <label className="block text-sm">
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="ru-input mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className="ru-input mt-1"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            {error ? (
              <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="ru-btn ru-btn-primary w-full"
            >
              {pending ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
