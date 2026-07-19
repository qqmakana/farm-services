"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import {
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { updateDriverPreferences, updateDriverVehicle } from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { DriverTrustPanel } from "@/components/driver-trust-panel";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import type { VehicleType } from "@/lib/types";

export function DriverAccountView() {
  const { driver, refresh, logout } = useDriverApp();
  const [editVehicle, setEditVehicle] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [reg, setReg] = useState(driver?.vehicle_registration ?? "");
  const [year, setYear] = useState(
    driver?.vehicle_year != null ? String(driver.vehicle_year) : "",
  );
  const [vehicleType, setVehicleType] = useState<VehicleType>(
    driver?.vehicle_type ?? "sedan",
  );
  const [night, setNight] = useState(driver?.prefer_night !== false);
  const [heavy, setHeavy] = useState(driver?.prefer_heavy !== false);
  const [village, setVillage] = useState(
    driver?.prefer_village_routes !== false,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!driver) return;
    setReg(driver.vehicle_registration ?? "");
    setYear(driver.vehicle_year != null ? String(driver.vehicle_year) : "");
    setVehicleType(driver.vehicle_type);
    setNight(driver.prefer_night !== false);
    setHeavy(driver.prefer_heavy !== false);
    setVillage(driver.prefer_village_routes !== false);
  }, [driver]);

  if (!driver) return null;

  const initial = driver.full_name.charAt(0).toUpperCase();

  function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateDriverVehicle(driver!.id, {
          vehicle_type: vehicleType,
          vehicle_registration: reg.trim() || null,
          vehicle_year: year ? Number(year) : null,
        });
        setEditVehicle(false);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  function savePrefs() {
    setError(null);
    startTransition(async () => {
      try {
        await updateDriverPreferences(driver!.id, {
          prefer_night: night,
          prefer_heavy: heavy,
          prefer_village_routes: village,
        });
        setShowNotifs(false);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-5 pb-24 pt-8">
      <h1 className="text-2xl font-bold text-slate-900">Account</h1>

      <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1A4D3A] text-2xl font-bold text-white">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-slate-900">{driver.full_name}</p>
          <p className="text-sm text-slate-500">{driver.phone}</p>
          <div className="mt-1">
            <DriverVerifiedBadge verified={driver.id_verified} compact />
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Vehicle
          </p>
          {driver.id_verified ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> ID Verified
            </span>
          ) : (
            <span className="text-xs font-semibold text-amber-700">
              Pending Verification
            </span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-slate-900">
          {VEHICLE_LABELS[driver.vehicle_type]}
          {driver.vehicle_registration
            ? ` · ${driver.vehicle_registration}`
            : ""}
          {driver.vehicle_year ? ` · ${driver.vehicle_year}` : ""}
        </p>
      </section>

      {error ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      <ul className="mt-6 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <li>
          <button
            type="button"
            onClick={() => setEditVehicle((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:scale-[0.99] active:bg-gray-50"
          >
            <Pencil className="h-5 w-5 text-[#1A4D3A]" />
            <span className="flex-1 text-sm font-medium">Edit Vehicle Details</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </li>
        {!driver.id_verified ? (
          <li>
            <button
              type="button"
              onClick={() => setShowDocs((v) => !v)}
              className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-4 text-left transition active:scale-[0.99] active:bg-gray-50"
            >
              <IdCard className="h-5 w-5 text-[#1A4D3A]" />
              <span className="flex-1 text-sm font-medium">
                Upload License/ID
              </span>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          </li>
        ) : null}
        <li>
          <button
            type="button"
            onClick={() => setShowNotifs((v) => !v)}
            className="flex w-full items-center gap-3 border-t border-gray-100 px-4 py-4 text-left transition active:scale-[0.99] active:bg-gray-50"
          >
            <span className="flex h-5 w-5 items-center justify-center text-[#1A4D3A]">
              ⚙
            </span>
            <span className="flex-1 text-sm font-medium">
              Notification Settings
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </button>
        </li>
        <li>
          <a
            href={BRAND_WHATSAPP_HREF}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 border-t border-gray-100 px-4 py-4 transition active:scale-[0.99] active:bg-gray-50"
          >
            <HelpCircle className="h-5 w-5 text-[#1A4D3A]" />
            <span className="flex-1 text-sm font-medium">Help &amp; Support</span>
            <span className="text-xs text-slate-400">{BRAND.phone}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </a>
        </li>
      </ul>

      {editVehicle ? (
        <form
          onSubmit={saveVehicle}
          className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <label className="block text-sm font-medium">
            Vehicle type
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            >
              {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
                <option key={v} value={v}>
                  {VEHICLE_LABELS[v]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Registration
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              placeholder="e.g. HX 12 EC"
            />
          </label>
          <label className="block text-sm font-medium">
            Year
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              inputMode="numeric"
              placeholder="2018"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#1A4D3A] py-3 text-sm font-bold text-white transition active:scale-95"
          >
            Save vehicle
          </button>
        </form>
      ) : null}

      {showDocs ? (
        <div className="mt-4">
          <DriverTrustPanel key={driver.id} driver={driver} />
        </div>
      ) : null}

      {showNotifs ? (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <Toggle
            label="Night shifts"
            checked={night}
            onChange={setNight}
          />
          <Toggle
            label="Heavy loads"
            checked={heavy}
            onChange={setHeavy}
          />
          <Toggle
            label="Village routes"
            checked={village}
            onChange={setVillage}
          />
          <button
            type="button"
            disabled={pending}
            onClick={savePrefs}
            className="w-full rounded-xl bg-[#1A4D3A] py-3 text-sm font-bold text-white transition active:scale-95"
          >
            Save preferences
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={logout}
        className="mt-8 flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold text-rose-600 transition active:scale-95"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </button>

      <p className="mt-4 text-center text-xs text-slate-400">
        <Link href="/driver" className="underline">
          Back to apply / switch driver
        </Link>
      </p>
    </main>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-slate-800">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition active:scale-95 ${
          checked ? "bg-[#1A4D3A]" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </label>
  );
}
