"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getDriverDocSignedUrl,
  listDriversPendingVerification,
  setDriverVerification,
} from "@/lib/actions";
import type { Driver } from "@/lib/types";

type Preview = {
  id?: string;
  selfie?: string;
  vehicle_front?: string;
  vehicle_side?: string;
};

export function VerificationsBoard() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [previews, setPreviews] = useState<Record<string, Preview>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reload() {
    startTransition(async () => {
      setError(null);
      try {
        const rows = await listDriversPendingVerification();
        setDrivers(rows);
        const map: Record<string, Preview> = {};
        await Promise.all(
          rows.map(async (d) => {
            const p: Preview = {};
            try {
              if (d.id_doc_url && !d.id_doc_url.startsWith("mock://")) {
                p.id = await getDriverDocSignedUrl(d.id_doc_url);
              }
              if (d.selfie_url && !d.selfie_url.startsWith("mock://")) {
                p.selfie = await getDriverDocSignedUrl(d.selfie_url);
              }
              if (
                d.vehicle_front_url &&
                !d.vehicle_front_url.startsWith("mock://")
              ) {
                p.vehicle_front = await getDriverDocSignedUrl(
                  d.vehicle_front_url,
                );
              }
              if (
                d.vehicle_side_url &&
                !d.vehicle_side_url.startsWith("mock://")
              ) {
                p.vehicle_side = await getDriverDocSignedUrl(d.vehicle_side_url);
              }
            } catch {
              /* signed URL optional in mock */
            }
            map[d.id] = p;
          }),
        );
        setPreviews(map);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    reload();
  }, []);

  function decide(driverId: string, decision: "verified" | "rejected") {
    startTransition(async () => {
      try {
        await setDriverVerification(driverId, decision, notes[driverId]);
        reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ID verifications
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Compare ID photo with selfie. Approve only when they match. Drivers
            stay offline until you verify.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          disabled={pending}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      ) : null}

      {drivers.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-slate-500">
          No pending verifications.
        </p>
      ) : (
        <ul className="space-y-6">
          {drivers.map((d) => {
            const p = previews[d.id] ?? {};
            return (
              <li
                key={d.id}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {d.full_name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {d.phone} · {d.vehicle_type} · {d.country_code || "ZA"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{d.notes}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    pending
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <PhotoSlot label="ID (front)" src={p.id} path={d.id_doc_url} />
                  <PhotoSlot label="Selfie" src={p.selfie} path={d.selfie_url} />
                  <PhotoSlot
                    label="Vehicle front"
                    src={p.vehicle_front}
                    path={d.vehicle_front_url}
                  />
                  <PhotoSlot
                    label="Vehicle side"
                    src={p.vehicle_side}
                    path={d.vehicle_side_url}
                  />
                </div>

                <label className="mt-4 block text-sm font-medium text-slate-700">
                  Note (optional — shown if rejected)
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    value={notes[d.id] ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [d.id]: e.target.value }))
                    }
                    placeholder="e.g. ID blurry — please re-upload"
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decide(d.id, "verified")}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Approve · ✓ Verified
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => decide(d.id, "rejected")}
                    className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function PhotoSlot({
  label,
  src,
  path,
}: {
  label: string;
  src?: string;
  path?: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-slate-50">
      <p className="border-b border-gray-100 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </p>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center p-2 text-center text-xs text-slate-400">
          {path?.startsWith("mock://")
            ? "Mock upload (local)"
            : path
              ? "Could not load preview"
              : "Missing"}
        </div>
      )}
    </div>
  );
}
