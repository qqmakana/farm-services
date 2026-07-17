"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { applyToDrive } from "@/lib/actions";
import { BRAND } from "@/lib/brand";
import type { VehicleType } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

export function DriverApplyForm() {
  const router = useRouter();
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
        });
        setMessage(
          "Approved. You’re on Village Ride — go online below and start earning.",
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
        South African drivers only. Use your SA mobile — {BRAND.appName}{" "}
        <strong>auto-approves</strong> you so you can go online and take trips
        right away. Shops and bakkie owners must also use this app.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
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
          <span className="font-medium">SA phone (WhatsApp)</span>
          <input
            required
            className="ru-input mt-1"
            placeholder="06x / 07x / 08x…"
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
          <span className="font-medium">Towns you cover</span>
          <input
            required
            className="ru-input mt-1"
            placeholder="Your village ↔ nearest town…"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium">Licence / vehicle notes</span>
          <textarea
            rows={2}
            className="ru-input mt-1"
            placeholder="Valid SA licence, bakkie year, furniture runs…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </label>

        {error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800 sm:col-span-2">
            {error}
          </p>
        )}
        {message && (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-900 sm:col-span-2">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="ru-btn ru-btn-primary sm:col-span-2 disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Apply — auto-approve if SA number"}
        </button>
      </form>
    </section>
  );
}
