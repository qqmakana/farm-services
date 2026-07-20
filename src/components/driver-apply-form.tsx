"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import { applyToDrive } from "@/lib/actions";
import { enabledCountries, type CountryCode } from "@/lib/countries";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import type { VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

export function DriverApplyForm() {
  const router = useRouter();
  const { countryCode, country, setCountry } = useCountry();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    vehicle_type: "bakkie" as VehicleType,
    area: "",
    notes: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await applyToDrive({
          full_name: form.full_name,
          phone: form.phone,
          vehicle_type: form.vehicle_type,
          area: form.area,
          notes: form.notes || undefined,
          country_code: countryCode,
        });
        setMessage(
          "Approved in the app. Scroll down, go online, and start taking trips.",
        );
        setForm({
          full_name: "",
          phone: "",
          vehicle_type: "bakkie",
          area: "",
          notes: "",
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Application failed");
      }
    });
  }

  return (
    <section className="ru-card p-5">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
        Apply to drive
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Apply <strong>only in this Village Ride app</strong> — not WhatsApp or
        Facebook. Local mobile for your country → the app{" "}
        <strong>auto-approves</strong> you. You only see jobs in your country.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Country</span>
          <select
            className="ru-input mt-1"
            value={countryCode}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
          >
            {enabledCountries().map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Full name</span>
          <input
            required
            className="ru-input mt-1"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">
            Phone ({country.flag} +{country.phonePrefix})
          </span>
          <input
            required
            className="ru-input mt-1"
            placeholder={formatPhonePlaceholder(countryCode)}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Vehicle</span>
          <select
            className="ru-input mt-1"
            value={form.vehicle_type}
            onChange={(e) =>
              setForm({
                ...form,
                vehicle_type: e.target.value as VehicleType,
              })
            }
          >
            {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
              <option key={v} value={v}>
                {VEHICLE_LABELS[v]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium">Area / town you cover</span>
          <input
            required
            className="ru-input mt-1"
            placeholder="Your village or town"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Notes (optional)</span>
          <input
            className="ru-input mt-1"
            placeholder="Licence / bakkie details"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit application"}
          </button>
        </div>
      </form>

      {message ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
    </section>
  );
}
