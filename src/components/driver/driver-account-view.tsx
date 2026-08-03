"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  Briefcase,
  ChevronRight,
  HelpCircle,
  IdCard,
  LogOut,
  Pencil,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { updateDriverCountry, updateDriverPreferences, updateDriverVehicle } from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { CountrySelector } from "@/components/country/country-selector";
import { useCountry } from "@/components/country/country-provider";
import { DriverTrustPanel } from "@/components/driver-trust-panel";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import { DriverVehiclePhotos } from "@/components/driver-vehicle-photos";
import { PageShell } from "@/components/ui/page-shell";
import { vehicleDisplayLabel } from "@/lib/driver-display";
import { getCountry, type CountryCode } from "@/lib/countries";
import { resetDriverOnboardingForReplay } from "@/lib/driver-onboarding";
import { isDriverTrustVerified } from "@/lib/trust";
import { VEHICLE_LABELS } from "@/lib/vehicles";
import type { VehicleType } from "@/lib/types";

export function DriverAccountView() {
  const router = useRouter();
  const { driver, refresh, logout } = useDriverApp();
  const { setCountry, countryCode } = useCountry();
  const [editVehicle, setEditVehicle] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [reg, setReg] = useState(driver?.vehicle_registration ?? "");
  const [year, setYear] = useState(
    driver?.vehicle_year != null ? String(driver.vehicle_year) : "",
  );
  const [make, setMake] = useState(driver?.vehicle_make ?? "");
  const [model, setModel] = useState(driver?.vehicle_model ?? "");
  const [color, setColor] = useState(driver?.vehicle_color ?? "");
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
    setMake(driver.vehicle_make ?? "");
    setModel(driver.vehicle_model ?? "");
    setColor(driver.vehicle_color ?? "");
    setVehicleType(driver.vehicle_type);
    setNight(driver.prefer_night !== false);
    setHeavy(driver.prefer_heavy !== false);
    setVillage(driver.prefer_village_routes !== false);
  }, [driver]);

  if (!driver) return null;

  const driverCountry = getCountry(driver.country_code);

  function saveCountry(code: CountryCode) {
    setError(null);
    setCountry(code);
    startTransition(async () => {
      try {
        await updateDriverCountry(driver!.id, code);
        refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save country");
      }
    });
  }

  function saveVehicle(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateDriverVehicle(driver!.id, {
          vehicle_type: vehicleType,
          vehicle_registration: reg.trim() || null,
          vehicle_year: year ? Number(year) : null,
          vehicle_make: make.trim() || null,
          vehicle_model: model.trim() || null,
          vehicle_color: color.trim() || null,
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
    <PageShell title="Account">
      <div className="ru-card space-y-4 p-5">
        <DriverVehiclePhotos driver={driver} variant="profile" />
        <div className="flex items-center justify-between gap-2 border-t border-[var(--ru-line)] pt-3">
          <div className="min-w-0">
            <p className="text-sm text-[var(--ru-muted)]">
              <span className="mr-1.5" aria-hidden>
                {driverCountry.flag}
              </span>
              {driver.phone}
            </p>
            <div className="mt-1">
              <DriverVerifiedBadge
                verified={isDriverTrustVerified(driver)}
                compact
              />
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[var(--ru-muted)]" aria-hidden />
        </div>
      </div>

      <section className="ru-card mt-4 p-4">
        <p className="ru-section-label mb-2">Operating country</p>
        <CountrySelector
          showLanguage={false}
          compact
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => saveCountry(countryCode)}
          className="ru-btn ru-btn-primary ru-btn-block mt-3"
        >
          Save country for matching
        </button>
        <p className="mt-2 text-xs text-[var(--ru-muted)]">
          You only receive jobs in {driverCountry.flag} {driverCountry.name}.
        </p>
      </section>

      <section className="ru-card mt-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="ru-section-label">Vehicle</p>
          {isDriverTrustVerified(driver) ? (
            <span className="ru-chip inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          ) : (
            <span className="ru-chip">Pending</span>
          )}
        </div>
        <p className="mt-2 text-sm font-semibold text-black">
          {vehicleDisplayLabel(driver)}
          {driver.vehicle_registration
            ? ` · ${driver.vehicle_registration}`
            : ""}
          {driver.vehicle_year ? ` · ${driver.vehicle_year}` : ""}
        </p>
      </section>

      {error ? (
        <p className="mt-3 rounded-[var(--ru-radius)] bg-[var(--ru-elevated)] px-3 py-2 text-sm text-[var(--ru-error)]">
          {error}
        </p>
      ) : null}

      <ul className="ru-list mt-6">
        <li>
          <button
            type="button"
            onClick={() => setEditVehicle((v) => !v)}
            className="ru-row w-full"
          >
            <span className="text-black">
              <Pencil className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-black">
              Edit Vehicle Details
            </span>
            <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
          </button>
        </li>
        {!isDriverTrustVerified(driver) ? (
          <li>
            <button
              type="button"
              onClick={() => setShowDocs((v) => !v)}
              className="ru-row w-full"
            >
              <span className="text-black">
                <IdCard className="h-5 w-5" />
              </span>
              <span className="flex-1 text-sm font-semibold text-black">
                Upload License/ID
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
            </button>
          </li>
        ) : null}
        <li>
          <button
            type="button"
            onClick={() => setShowNotifs((v) => !v)}
            className="ru-row w-full"
          >
            <span className="text-black">
              <Settings className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-black">
              Notification Settings
            </span>
            <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
          </button>
        </li>
        <li>
          <Link href="/driver/group" className="ru-row w-full">
            <span className="text-black">
              <Users className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-black">
              Group Rides
            </span>
            <span className="text-xs text-[var(--ru-muted)]">Shared loads</span>
            <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
          </Link>
        </li>
        <li>
          <Link href="/driver/jobs" className="ru-row w-full">
            <span className="text-black">
              <Briefcase className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-black">
              Trip history
            </span>
            <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
          </Link>
        </li>
        <li>
          <Link href="/help" className="ru-row w-full">
            <span className="text-black">
              <HelpCircle className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm font-semibold text-black">
              Help &amp; Support
            </span>
            <span className="text-xs text-[var(--ru-muted)]">WhatsApp · Email</span>
            <ChevronRight className="h-4 w-4 text-[var(--ru-muted)]" aria-hidden />
          </Link>
        </li>
      </ul>

      {editVehicle ? (
        <form
          onSubmit={saveVehicle}
          className="ru-card mt-4 space-y-3 p-4"
        >
          <label className="block text-sm font-semibold text-black">
            Vehicle type
            <select
              className="ru-soft-field mt-1"
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
          <label className="block text-sm font-semibold text-black">
            Registration
            <input
              className="ru-soft-field mt-1"
              value={reg}
              onChange={(e) => setReg(e.target.value)}
              placeholder="e.g. HX 12 EC"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-black">
              Make
              <input
                className="ru-soft-field mt-1"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
              />
            </label>
            <label className="block text-sm font-semibold text-black">
              Model
              <input
                className="ru-soft-field mt-1"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Hilux"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm font-semibold text-black">
              Color
              <input
                className="ru-soft-field mt-1"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="White"
              />
            </label>
            <label className="block text-sm font-semibold text-black">
              Year
              <input
                className="ru-soft-field mt-1"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                inputMode="numeric"
                placeholder="2018"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="ru-btn ru-btn-primary ru-btn-block"
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
        <div className="ru-card mt-4 space-y-3 p-4">
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
            label="Rural / landmark-heavy routes"
            checked={village}
            onChange={setVillage}
          />
          <button
            type="button"
            disabled={pending}
            onClick={savePrefs}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            Save preferences
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => {
          resetDriverOnboardingForReplay();
          router.push("/driver/guide");
        }}
        className="ru-btn ru-btn-secondary ru-btn-block mt-6"
      >
        Replay driver guide
      </button>

      <button
        type="button"
        onClick={logout}
        className="ru-btn ru-btn-ghost ru-btn-block mt-3 !text-[var(--ru-error)]"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </button>

      <p className="mt-4 text-center text-xs text-[var(--ru-muted)]">
        <Link href="/driver" className="underline">
          Back to apply / switch driver
        </Link>
      </p>
    </PageShell>
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
    <label className="flex items-center justify-between gap-3 text-sm font-medium text-black">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition active:scale-95 ${
          checked ? "bg-black" : "bg-[var(--ru-elevated)]"
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
