"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { SiteNav } from "@/components/site-nav";
import { submitDriverJoinApplication } from "@/lib/actions-ops";
import { BRAND } from "@/lib/brand";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

export function DriverJoinForm() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    vehicle_type: "bakkie" as "sedan" | "bakkie" | "truck",
    area: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      try {
        await submitDriverJoinApplication(form);
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900">Application received</h2>
        <p className="mt-2 text-sm text-slate-700">
          Next steps: we&apos;ll WhatsApp you, then you complete ID + vehicle
          photos in the driver app.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            href="/driver"
            className="rounded-xl bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white"
          >
            Open driver app
          </Link>
          <a
            href={WhatsAppLinks.chatUs()}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-5 shadow-sm">
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>
      ) : null}
      <input
        required
        placeholder="Full name"
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
      />
      <input
        type="email"
        placeholder="Email (optional)"
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        required
        placeholder="Phone / WhatsApp"
        inputMode="tel"
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <select
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
        value={form.vehicle_type}
        onChange={(e) =>
          setForm({
            ...form,
            vehicle_type: e.target.value as typeof form.vehicle_type,
          })
        }
      >
        <option value="sedan">Sedan / car</option>
        <option value="bakkie">Bakkie</option>
        <option value="truck">Truck</option>
      </select>
      <input
        placeholder="Area (e.g. Mthatha)"
        className="w-full rounded-lg border px-3 py-2.5 text-sm"
        value={form.area}
        onChange={(e) => setForm({ ...form, area: e.target.value })}
      />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#1A4D3A] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Apply to drive"}
      </button>
      <p className="text-center text-xs text-slate-500">
        Or chat {BRAND.phone} on WhatsApp anytime.
      </p>
    </form>
  );
}

export default function DriverJoinPage() {
  return (
    <>
      <SiteNav active="driver" />
      <main className="mx-auto max-w-lg px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Drive with {BRAND.appName}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Earn money with your vehicle
        </h1>
        <p className="mt-3 text-base text-slate-700">
          Keep <strong>85%</strong> of every trip. Platform fee is ~15% from your
          prepaid wallet — no monthly fees.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          <li>✓ Verified partner deliveries + rides</li>
          <li>✓ Push notifications for new jobs</li>
          <li>✓ Go online when you want</li>
        </ul>
        <div className="mt-6">
          <DriverJoinForm />
        </div>
        <a
          href={WhatsAppLinks.chatUs()}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white"
        >
          Chat with us on WhatsApp
        </a>
      </main>
    </>
  );
}
