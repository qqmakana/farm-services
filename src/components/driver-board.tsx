"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  acceptOffer,
  completeTrip,
  declineOffer,
  listIncomingOffers,
  listDriverActiveJob,
  saveDriverFcmToken,
  setDriverOnline,
  startTrip,
  updateDriverLocation,
} from "@/lib/actions";
import {
  formatMoney,
  formatWhen,
  SERVICE_LABELS,
  STATUS_LABELS,
  VEHICLE_LABELS,
} from "@/lib/format";
import { DriverPushPrompt } from "@/components/driver-push-prompt";
import { DriverTrustPanel } from "@/components/driver-trust-panel";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";
import type { Driver, JobApplication, JobWithDriver } from "@/lib/types";
import { distanceKm, etaMinutes } from "@/lib/geo";
import { useDriverOffersRealtime } from "@/lib/use-driver-offers-realtime";

export function DriverBoard({
  drivers,
  jobs,
}: {
  drivers: Driver[];
  jobs: JobWithDriver[];
}) {
  const router = useRouter();
  const [driverId, setDriverId] = useState(drivers[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<JobApplication[]>([]);
  const [active, setActive] = useState<JobWithDriver | null>(null);

  const driver = drivers.find((d) => d.id === driverId);

  const refreshDriverViews = useCallback(async (id: string) => {
    void fetch("/api/dispatch/tick", { method: "POST" }).catch(() => null);
    const [incoming, current] = await Promise.all([
      listIncomingOffers(id),
      listDriverActiveJob(id),
    ]);
    setOffers(incoming);
    setActive(current);
  }, []);

  useDriverOffersRealtime(driverId || null, () => {
    if (driverId) void refreshDriverViews(driverId);
  });

  useEffect(() => {
    if (!driverId) return;
    void refreshDriverViews(driverId);
    const t = setInterval(() => void refreshDriverViews(driverId), 4000);
    return () => clearInterval(t);
  }, [driverId, jobs, refreshDriverViews]);

  useEffect(() => {
    if (!driver?.is_online || !driverId) return;
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        void updateDriverLocation(
          driverId,
          pos.coords.latitude,
          pos.coords.longitude,
        );
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [driver?.is_online, driverId]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await refreshDriverViews(driverId);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function goOnline(online: boolean) {
    run(async () => {
      let lat: number | undefined;
      let lng: number | undefined;
      if (online && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 8000,
            }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch {
          /* mock store fills Engcobo default */
        }
      }
      await setDriverOnline(driverId, online, lat, lng);

      // Free FCM: ask permission + save token when going online
      if (online && isFirebaseClientConfigured()) {
        try {
          const token = await requestFcmToken();
          if (token) await saveDriverFcmToken(driverId, token);
        } catch {
          /* driver can still use in-app offers */
        }
      }
    });
  }

  const earnings = useMemo(
    () =>
      jobs
        .filter((j) => j.driver_id === driverId && j.status === "completed")
        .reduce((sum, j) => sum + Number(j.fee_amount), 0),
    [jobs, driverId],
  );

  return (
    <div className="space-y-4">
      {driverId ? <DriverPushPrompt driverId={driverId} /> : null}
      <div className="ru-card flex flex-wrap items-center justify-between gap-3 p-4">
        <label className="text-sm font-medium text-slate-700">
          Driver account
          <select
            className="ru-input mt-1 min-w-[220px]"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
          >
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} · {VEHICLE_LABELS[d.vehicle_type]} · ★
                {d.rating_avg.toFixed(1)}
                {d.id_verified ? " · Verified" : " · Pending"}
              </option>
            ))}
          </select>
          {driver ? (
            <span className="mt-2 inline-block">
              <DriverVerifiedBadge verified={driver.id_verified} />
            </span>
          ) : null}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-600">
            Today&apos;s trips paid:{" "}
            <strong>{formatMoney(earnings)}</strong>
          </span>
          <button
            type="button"
            disabled={pending || !driverId}
            onClick={() => goOnline(!(driver?.is_online ?? false))}
            className={`ru-btn px-4 py-2 text-sm font-semibold text-white ${
              driver?.is_online
                ? "bg-emerald-600 hover:bg-emerald-500"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {driver?.is_online ? "Online · tap to go offline" : "Go online"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {driver ? <DriverTrustPanel key={driver.id} driver={driver} /> : null}

      {active && (
        <section className="ru-card border-emerald-200 p-5">
          <p className="text-xs font-semibold tracking-wide text-emerald-700 uppercase">
            Active trip
          </p>
          <h2 className="mt-1 text-xl font-bold">
            {active.reference_code} · {STATUS_LABELS[active.status]}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {SERVICE_LABELS[active.service_type]} ·{" "}
            {formatMoney(Number(active.fee_amount))}
            {active.payment_method === "cash" ? (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                Collect cash
              </span>
            ) : null}
          </p>
          {active.payment_method === "cash" &&
          active.payment_status === "unpaid" ? (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Customer pays you {formatMoney(Number(active.fee_amount))} in cash
              when the trip starts.
            </p>
          ) : null}
          <p className="mt-2 text-sm">
            <strong>Pickup:</strong> {active.pickup_landmark}
          </p>
          <p className="text-sm">
            <strong>Dropoff:</strong> {active.dropoff_landmark}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(active.status === "assigned" ||
              active.status === "confirmed") && (
              <button
                type="button"
                disabled={pending}
                className="ru-btn ru-btn-primary"
                onClick={() => run(() => startTrip(active.id, driverId))}
              >
                Start trip
              </button>
            )}
            {active.status === "in_progress" && (
              <button
                type="button"
                disabled={pending}
                className="ru-btn bg-slate-900 text-white"
                onClick={() => run(() => completeTrip(active.id, driverId))}
              >
                Complete trip
              </button>
            )}
            <a
              className="ru-btn border border-slate-200 bg-white text-slate-800"
              href={`/trip/${active.reference_code}`}
            >
              Open live map
            </a>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
          Incoming requests
        </h2>
        {!driver?.is_online ? (
          <p className="ru-card p-6 text-center text-sm text-slate-500">
            Go online to receive trip requests — like Uber Driver.
          </p>
        ) : offers.length === 0 ? (
          <p className="ru-card p-6 text-center text-sm text-slate-500">
            Waiting for nearby requests…
          </p>
        ) : (
          <ul className="space-y-3">
            {offers.map((offer) => {
              const job = offer.jobs;
              if (!job) return null;
              const dist =
                driver.last_lat != null &&
                driver.last_lng != null &&
                job.pickup_lat != null &&
                job.pickup_lng != null
                  ? distanceKm(
                      { lat: driver.last_lat, lng: driver.last_lng },
                      { lat: job.pickup_lat, lng: job.pickup_lng },
                    )
                  : null;
              return (
                <li key={offer.id} className="ru-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-sm font-semibold">
                        {job.reference_code}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {SERVICE_LABELS[job.service_type]} ·{" "}
                        {VEHICLE_LABELS[job.required_vehicle]} ·{" "}
                        {formatWhen(job.scheduled_for)}
                      </p>
                      <p className="mt-2 text-sm">{job.pickup_landmark}</p>
                      <p className="text-sm text-slate-500">
                        → {job.dropoff_landmark}
                      </p>
                      {dist != null && (
                        <p className="mt-1 text-xs text-emerald-700">
                          ~{dist.toFixed(1)} km away · ETA {etaMinutes(dist)}{" "}
                          min
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatMoney(Number(job.fee_amount))}
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                          onClick={() =>
                            run(() => acceptOffer(job.id, driverId))
                          }
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-800"
                          onClick={() =>
                            run(() => declineOffer(job.id, driverId))
                          }
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
