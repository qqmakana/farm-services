"use client";

import Link from "next/link";
import { useDriverApp } from "@/components/driver/driver-app-provider";

export function DriverGate({ children }: { children: React.ReactNode }) {
  const { driver, loading } = useDriverApp();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center pb-24">
        <p className="text-sm text-slate-500">Loading driver app…</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 pb-24">
        <h1 className="text-2xl font-bold text-slate-900">Driver sign-in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select your approved driver profile or sign in with a linked driver
          account to use the app.
        </p>
        <Link
          href="/driver"
          className="mt-6 rounded-xl bg-[#1A4D3A] py-3.5 text-center text-sm font-bold text-white transition active:scale-95"
        >
          Choose driver / Apply
        </Link>
        <Link
          href="/login?next=/driver/home"
          className="mt-3 text-center text-sm font-semibold text-[#1A4D3A] transition active:scale-95"
        >
          Sign in with email
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
