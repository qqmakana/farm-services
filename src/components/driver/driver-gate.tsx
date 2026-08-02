"use client";

import Link from "next/link";
import { useDriverApp } from "@/components/driver/driver-app-provider";

export function DriverGate({ children }: { children: React.ReactNode }) {
  const { driver, loading } = useDriverApp();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <p className="text-sm text-[var(--ru-muted)]">Loading driver app…</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="ru-page flex flex-col justify-center">
        <h1 className="ru-page-title">Driver sign-in</h1>
        <p className="ru-page-sub">
          Select your approved driver profile or sign in with a linked driver
          account to use the app.
        </p>
        <Link href="/driver" className="ru-btn ru-btn-primary ru-btn-block mt-6">
          Choose driver / Apply
        </Link>
        <Link
          href="/login?next=/driver/home"
          className="ru-btn ru-btn-ghost ru-btn-block mt-1"
        >
          Sign in with email
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
