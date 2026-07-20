"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SiteNav } from "@/components/site-nav";
import { DriverApplyForm } from "@/components/driver-apply-form";
import { listDrivers } from "@/lib/actions";
import { setSelectedDriverId } from "@/lib/driver-session";
import { isDriverTrustVerified } from "@/lib/trust";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import type { Driver } from "@/lib/types";

export default function DriverLandingPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverId, setDriverId] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void listDrivers().then((rows) => {
      setDrivers(rows);
      if (rows[0]) setDriverId(rows[0].id);
    });
  }, []);

  function openApp() {
    if (!driverId) return;
    setSelectedDriverId(driverId);
    startTransition(() => {
      router.push("/driver/home");
    });
  }

  return (
    <>
      <SiteNav active="driver" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 pb-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Driver app
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Apply · go online · earn
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            New drivers apply first. Approved drivers open the premium driver
            app — map, jobs, wallet, account.
          </p>
        </div>

        <section className="rounded-xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Open driver app
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select your approved profile to enter the 4-tab driver shell.
          </p>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Driver
            <select
              className="ru-input mt-1 w-full max-w-md"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.full_name} · {VEHICLE_LABELS[d.vehicle_type]}
                  {isDriverTrustVerified(d) ? " · ✓ Verified" : " · Pending ID"}
                </option>
              ))}
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!driverId || pending}
              onClick={openApp}
              className="rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              Enter driver app
            </button>
            <Link
              href="/login?next=/driver/home"
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-slate-800 transition active:scale-95"
            >
              Sign in (linked account)
            </Link>
          </div>
        </section>

        <DriverApplyForm />
      </main>
    </>
  );
}
