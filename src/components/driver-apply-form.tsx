"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import { applyToDriveWithTrust } from "@/lib/actions";
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
  const [conduct, setConduct] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("country_code", countryCode);
    fd.set("code_of_conduct", conduct ? "true" : "false");

    startTransition(async () => {
      try {
        await applyToDriveWithTrust(fd);
        setMessage(
          "Application received. Village Ride will verify your ID & photos — you cannot go online until you see ✓ Verified.",
        );
        form.reset();
        setConduct(false);
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
        Apply <strong>only in this app</strong>. Upload clear photos — we
        manually verify every driver before they go online. &ldquo;Verified&rdquo;
        means Village Ride checked your ID &amp; vehicle photos.
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
          <input required name="full_name" className="ru-input mt-1" />
        </label>
        <label className="block text-sm">
          <span className="font-medium">
            Phone ({country.flag} +{country.phonePrefix})
          </span>
          <input
            required
            name="phone"
            className="ru-input mt-1"
            placeholder={formatPhonePlaceholder(countryCode)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Vehicle</span>
          <select
            name="vehicle_type"
            className="ru-input mt-1"
            defaultValue={"bakkie" satisfies VehicleType}
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
            name="area"
            className="ru-input mt-1"
            placeholder="Your village or town"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Notes (optional)</span>
          <input
            name="notes"
            className="ru-input mt-1"
            placeholder="Licence / bakkie details"
          />
        </label>

        <div className="sm:col-span-2 rounded-xl border border-amber-100 bg-amber-50/80 p-4">
          <p className="text-sm font-bold text-amber-950">
            Required photos (max 5MB each)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-slate-700">
              ID photo (front) *
              <input
                required
                name="id_doc"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Face / selfie *
              <input
                required
                name="selfie"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Vehicle front (plate visible) *
              <input
                required
                name="vehicle_front"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-slate-700">
              Vehicle side *
              <input
                required
                name="vehicle_side"
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm"
              />
            </label>
          </div>
        </div>

        <label className="flex items-start gap-2 sm:col-span-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={conduct}
            onChange={(e) => setConduct(e.target.checked)}
            required
          />
          <span>
            I agree to the{" "}
            <Link
              href="/driver/conduct"
              className="font-semibold text-[#1A4D3A] underline"
              target="_blank"
            >
              Village Ride Driver Code of Conduct
            </Link>
            .
          </span>
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={pending || !conduct}
            className="rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {pending ? "Submitting…" : "Submit for verification"}
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
