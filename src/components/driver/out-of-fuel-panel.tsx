"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  acceptFuelHelp,
  cancelFuelRequest,
  createFuelRequest,
  listMyFuelRequest,
  listNearbyFuelHelp,
  markFuelDelivered,
} from "@/lib/actions-fuel";
import type { FuelAmount, FuelRequest } from "@/lib/types";

const AMOUNTS: FuelAmount[] = ["5L", "10L", "20L"];

type Props = {
  driverId: string;
  coords: { lat: number; lng: number } | null;
  countryCode?: string;
};

export function OutOfFuelPanel({ driverId, coords, countryCode }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<FuelAmount>("10L");
  const [landmark, setLandmark] = useState("");
  const [mine, setMine] = useState<FuelRequest | null>(null);
  const [nearby, setNearby] = useState<FuelRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reload = useCallback(async () => {
    const [m, n] = await Promise.all([
      listMyFuelRequest(driverId),
      listNearbyFuelHelp(driverId, coords?.lat, coords?.lng),
    ]);
    setMine(m);
    setNearby(n);
  }, [driverId, coords?.lat, coords?.lng]);

  useEffect(() => {
    void reload();
    const t = setInterval(() => void reload(), 8000);
    return () => clearInterval(t);
  }, [reload]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    start(async () => {
      try {
        await fn();
        await reload();
        setOpen(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="ru-btn ru-btn-secondary ru-btn-block !min-h-11 !text-sm"
      >
        Out of fuel
      </button>

      {error ? (
        <p className="rounded-[var(--ru-radius)] bg-[var(--ru-elevated)] px-3 py-2 text-xs text-[var(--ru-error)]">
          {error}
        </p>
      ) : null}

      {mine ? (
        <div className="rounded-[var(--ru-radius)] border border-[var(--ru-line)] bg-[var(--ru-elevated)] px-3 py-3">
          <p className="ru-section-label">
            Your fuel request · {mine.status}
          </p>
          <p className="mt-1 text-sm font-bold text-black">
            {mine.fuel_amount}
            {mine.location_landmark ? ` · ${mine.location_landmark}` : ""}
          </p>
          <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
            {mine.status === "pending"
              ? "Nearby drivers notified. Pay them in cash when fuel arrives."
              : mine.status === "assigned"
                ? "A helper is on the way. Pay cash for fuel when they arrive."
                : null}
          </p>
          <div className="mt-2 flex gap-2">
            {mine.status === "assigned" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => markFuelDelivered(mine.id, driverId))
                }
                className="ru-btn ru-btn-primary !min-h-9 flex-1 !text-xs"
              >
                Fuel received
              </button>
            ) : null}
            {mine.status === "pending" || mine.status === "assigned" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => cancelFuelRequest(mine.id, driverId))}
                className="ru-btn ru-btn-secondary !min-h-9 flex-1 !text-xs"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {nearby.length > 0 ? (
        <div className="space-y-2">
          <p className="ru-section-label">
            Drivers need fuel nearby
          </p>
          {nearby.map((r) => (
            <div
              key={r.id}
              className="ru-card px-3 py-3"
            >
              <p className="text-sm font-bold text-black">
                Need {r.fuel_amount}
              </p>
              <p className="mt-0.5 text-xs text-[var(--ru-muted)]">
                {r.location_landmark || "Location shared by GPS"}
                {r.requester?.full_name
                  ? ` · ${r.requester.full_name}`
                  : ""}
              </p>
              <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
                They pay you cash for fuel
              </p>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => acceptFuelHelp(r.id, driverId))}
                className="ru-btn ru-btn-primary mt-2 !min-h-9 w-full !text-xs"
              >
                I can bring fuel
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {open && !mine ? (
        <div className="ru-card px-3 py-3">
          <p className="text-sm font-bold text-black">Request fuel help</p>
          <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
            Nearby online drivers get a push. Pay them in cash for the fuel.
          </p>
          <p className="mt-3 text-xs font-semibold text-black">How much?</p>
          <div
            className="ru-segment mt-1.5"
            style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
          >
            {AMOUNTS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAmount(a)}
                aria-selected={amount === a}
                className="!min-h-9 !text-sm"
              >
                {a}
              </button>
            ))}
          </div>
          <label className="mt-3 block text-xs font-semibold text-black">
            Describe where you are
            <input
              className="ru-soft-field mt-1"
              placeholder="e.g. Near clinic gate, N2 after Engcobo"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
          </label>
          <p className="mt-1 text-[11px] text-[var(--ru-muted)]">
            {coords
              ? "GPS attached automatically."
              : "No GPS yet — description required."}
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(() =>
                createFuelRequest({
                  driver_id: driverId,
                  fuel_amount: amount,
                  location_lat: coords?.lat ?? null,
                  location_lng: coords?.lng ?? null,
                  location_landmark: landmark.trim() || null,
                  country_code: countryCode,
                  payment_method: "cash",
                }),
              )
            }
            className="ru-btn ru-btn-primary ru-btn-block mt-3 !text-sm"
          >
            {pending ? "Sending…" : "Request fuel now"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
