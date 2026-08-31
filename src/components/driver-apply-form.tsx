"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCountry } from "@/components/country/country-provider";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { operatingCountries, type CountryCode } from "@/lib/countries";
import { formatPhonePlaceholder } from "@/lib/country-preference";
import {
  isValidSaIdNumber,
  normalizeSaId,
  SA_ID_REJECT_MESSAGE,
  saIdRequiredForCountry,
} from "@/lib/sa-id";
import type { VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-sm font-semibold text-slate-800">{children}</span>
  );
}

export function DriverApplyForm({
  compactTitle,
}: {
  compactTitle?: string;
}) {
  const router = useRouter();
  const { countryCode, country, setCountry } = useCountry();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [conduct, setConduct] = useState(false);
  const [saId, setSaId] = useState("");
  const needSaId = saIdRequiredForCountry(countryCode);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("country_code", countryCode);
    fd.set("code_of_conduct", conduct ? "true" : "false");
    if (needSaId) {
      const id = normalizeSaId(saId);
      fd.set("id_number", id);
      if (!isValidSaIdNumber(id)) {
        setError(SA_ID_REJECT_MESSAGE);
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/driver/apply", {
          method: "POST",
          body: fd,
        });
        let data: { ok?: boolean; error?: string; driverId?: string } = {};
        try {
          data = (await res.json()) as typeof data;
        } catch {
          setError(
            "Server returned an invalid response. Check your connection and try again.",
          );
          return;
        }
        if (!res.ok || !data.ok) {
          setError(
            data.error ||
              "Application failed. Please try again in a moment.",
          );
          return;
        }
        setMessage(
          "Thanks — your photos were received. Paid jobs start at the end of September. A human will verify your SA ID before your first paid trip.",
        );
        form.reset();
        setConduct(false);
        setSaId("");
        router.refresh();
      } catch {
        setError(
          "Could not reach the server. Check your connection and try again.",
        );
      }
    });
  }

  return (
    <section className="ru-card border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-slate-900">
        {compactTitle ?? "Apply to drive"}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-700">
        Apply once for <strong className="text-slate-900">Trip</strong>,{" "}
        <strong className="text-slate-900">Fetch</strong>,{" "}
        <strong className="text-slate-900">Send</strong>, and{" "}
        <strong className="text-slate-900">Shops</strong>. Paid jobs start at
        the end of September. Upload a clear photo of yourself and your vehicle
        (plate visible).
      </p>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950">
        Upload your documents to get started. You can start browsing jobs
        immediately. A human will verify your ID before your first paid trip.
      </p>

      <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <FieldLabel>Country</FieldLabel>
          <select
            className="ru-input mt-1.5"
            value={countryCode}
            onChange={(e) => setCountry(e.target.value as CountryCode)}
          >
            {operatingCountries().map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <FieldLabel>Full name</FieldLabel>
          <input required name="full_name" className="ru-input mt-1.5" />
        </label>
        <label className="block">
          <FieldLabel>
            Phone ({country.flag} +{country.phonePrefix})
          </FieldLabel>
          <input
            required
            name="phone"
            className="ru-input mt-1.5"
            placeholder={formatPhonePlaceholder(countryCode)}
          />
        </label>
        <label className="block">
          <FieldLabel>Vehicle</FieldLabel>
          <select
            name="vehicle_type"
            className="ru-input mt-1.5"
            defaultValue={"sedan" satisfies VehicleType}
          >
            {(Object.keys(VEHICLE_LABELS) as VehicleType[]).map((v) => (
              <option key={v} value={v}>
                {VEHICLE_LABELS[v]}
              </option>
            ))}
          </select>
        </label>
        {needSaId ? (
          <label className="block sm:col-span-2">
            <FieldLabel>South African ID number</FieldLabel>
            <input
              required
              name="id_number"
              inputMode="numeric"
              autoComplete="off"
              maxLength={13}
              value={saId}
              onChange={(e) =>
                setSaId(e.target.value.replace(/\D/g, "").slice(0, 13))
              }
              className="ru-input mt-1.5"
              placeholder="13 digits — smart ID or green book"
              aria-describedby="sa-id-hint"
            />
            <p id="sa-id-hint" className="mt-1.5 text-xs leading-relaxed text-slate-600">
              South Africa drivers must use a 13-digit South African ID. Passports
              and foreign IDs are not accepted.
            </p>
          </label>
        ) : null}
        <label className="block">
          <FieldLabel>Area / town you cover</FieldLabel>
          <input
            required
            name="area"
            className="ru-input mt-1.5"
            placeholder="Your village or town"
          />
        </label>
        <label className="block">
          <FieldLabel>Make</FieldLabel>
          <input
            name="vehicle_make"
            className="ru-input mt-1.5"
            placeholder="Toyota"
          />
        </label>
        <label className="block">
          <FieldLabel>Model</FieldLabel>
          <input
            name="vehicle_model"
            className="ru-input mt-1.5"
            placeholder="Hilux"
          />
        </label>
        <label className="block">
          <FieldLabel>Color</FieldLabel>
          <input
            name="vehicle_color"
            className="ru-input mt-1.5"
            placeholder="White"
          />
        </label>
        <label className="block">
          <FieldLabel>License plate</FieldLabel>
          <input
            name="vehicle_registration"
            className="ru-input mt-1.5"
            placeholder="EC 123-456"
          />
        </label>
        <label className="block sm:col-span-2">
          <FieldLabel>Notes (optional)</FieldLabel>
          <input
            name="notes"
            className="ru-input mt-1.5"
            placeholder="Anything else we should know"
          />
        </label>

        <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">
            Required photos (JPEG/PNG — we shrink them automatically)
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <PhotoUploadField
              required
              name="id_doc"
              label={
                needSaId
                  ? "South African ID (front)"
                  : "ID photo (front)"
              }
              hint={
                needSaId
                  ? "Smart ID or green book — not a passport"
                  : undefined
              }
            />
            <PhotoUploadField
              required
              name="selfie"
              label="Your photo (face)"
              hint="So customers know who to look for"
            />
            <PhotoUploadField
              required
              name="vehicle_front"
              label="Vehicle photo"
              hint="Front with license plate visible"
            />
            <PhotoUploadField
              required
              name="vehicle_side"
              label="Vehicle side"
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-800 sm:col-span-2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[#000000]"
            checked={conduct}
            onChange={(e) => setConduct(e.target.checked)}
            required
          />
          <span>
            I agree to the{" "}
            <Link
              href="/driver/conduct"
              className="font-semibold text-[#000000] underline"
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
            className="w-full rounded-xl bg-[#000000] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-50 sm:w-auto"
          >
            {pending ? "Uploading photos…" : "Submit for verification"}
          </button>
        </div>
      </form>

      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-950">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-900">
          {error}
        </p>
      ) : null}
    </section>
  );
}
