"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  submitDriverDocuments,
  updateDriverPreferences,
} from "@/lib/actions";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import type { Driver } from "@/lib/types";

export function DriverTrustPanel({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [night, setNight] = useState(driver.prefer_night !== false);
  const [heavy, setHeavy] = useState(driver.prefer_heavy !== false);
  const [village, setVillage] = useState(
    driver.prefer_village_routes !== false,
  );
  const [licenseNumber, setLicenseNumber] = useState(
    driver.license_number ?? "",
  );

  function savePrefs() {
    setError(null);
    setMsg(null);
    startTransition(async () => {
      try {
        await updateDriverPreferences(driver.id, {
          prefer_night: night,
          prefer_heavy: heavy,
          prefer_village_routes: village,
        });
        setMsg("Trip preferences saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  function submitDocs(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("license_number", licenseNumber);
    startTransition(async () => {
      try {
        await submitDriverDocuments(driver.id, fd);
        setMsg("Documents submitted — ops will verify ID & license.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <section className="ru-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold text-[#1A4D3A]">
          Trust & trip types
        </h2>
        <DriverVerifiedBadge verified={driver.id_verified} />
      </div>

      <div>
        <p className="text-sm font-semibold text-[#1A4D3A]">
          I accept these jobs
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Matching prefers drivers who opted in for Night Shifts, Heavy Loads,
          and Direct Village Routes.
        </p>
        <div className="mt-3 space-y-2">
          {(
            [
              {
                key: "night",
                label: "Night Shifts (18:00–06:00)",
                checked: night,
                set: setNight,
              },
              {
                key: "heavy",
                label: "Heavy Loads (delivery / farm goods)",
                checked: heavy,
                set: setHeavy,
              },
              {
                key: "village",
                label: "Direct Village Routes",
                checked: village,
                set: setVillage,
              },
            ] as const
          ).map((opt) => (
            <label
              key={opt.key}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={opt.checked}
                onChange={(e) => opt.set(e.target.checked)}
                className="h-4 w-4 accent-[#1A4D3A]"
              />
              <span className="font-medium text-slate-800">{opt.label}</span>
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={savePrefs}
          className="mt-3 rounded-xl bg-[#1A4D3A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          Save preferences
        </button>
      </div>

      <form onSubmit={submitDocs} className="space-y-3 border-t border-slate-100 pt-4">
        <p className="text-sm font-semibold text-[#1A4D3A]">
          ID &amp; license verification
        </p>
        <p className="text-xs text-slate-500">
          Upload clear photos. Ops marks you verified after review — customers
          see the green badge.
        </p>
        <label className="block text-sm font-medium text-slate-800">
          License / PDP number
          <input
            required
            className="ru-input mt-1"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="e.g. SA license number"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          ID document photo
          <input
            name="id_doc"
            type="file"
            accept="image/*,application/pdf"
            className="mt-1 block w-full text-sm"
          />
        </label>
        <label className="block text-sm font-medium text-slate-800">
          Driver&apos;s license photo
          <input
            name="license_doc"
            type="file"
            accept="image/*,application/pdf"
            className="mt-1 block w-full text-sm"
          />
        </label>
        {driver.docs_submitted_at ? (
          <p className="text-xs text-emerald-800">
            Docs last submitted{" "}
            {new Date(driver.docs_submitted_at).toLocaleString("en-ZA")}
            {driver.id_verified ? " · Verified" : " · Awaiting ops review"}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl border border-[#1A4D3A] bg-white px-4 py-2.5 text-sm font-bold text-[#1A4D3A] disabled:opacity-50"
        >
          {pending ? "Uploading…" : "Submit documents"}
        </button>
      </form>

      {msg ? (
        <p className="text-sm text-emerald-800">{msg}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}
    </section>
  );
}
