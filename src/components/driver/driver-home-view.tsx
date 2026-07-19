"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  acceptOffer,
  declineOffer,
  listIncomingOffers,
  saveDriverFcmToken,
  setDriverOnline,
  updateDriverLocation,
} from "@/lib/actions";
import { useDriverApp } from "@/components/driver/driver-app-provider";
import { DriverPushPrompt } from "@/components/driver-push-prompt";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";
import { formatMoney, SERVICE_LABELS } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { useDriverOffersRealtime } from "@/lib/use-driver-offers-realtime";
import type { JobApplication } from "@/lib/types";

const DriverJobsMap = dynamic(
  () =>
    import("@/components/maps/driver-jobs-map").then((m) => m.DriverJobsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#E8EEE9] text-sm text-[#1A4D3A]">
        Loading map…
      </div>
    ),
  },
);

const RADIUS_KM = 20;

export function DriverHomeView() {
  const { driver, driverId, refresh } = useDriverApp();
  const [offers, setOffers] = useState<JobApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const loadOffers = useCallback(async () => {
    if (!driverId) return;
    void fetch("/api/dispatch/tick", { method: "POST" }).catch(() => null);
    const incoming = await listIncomingOffers(driverId);
    setOffers(incoming);
  }, [driverId]);

  useDriverOffersRealtime(driverId, () => {
    void loadOffers();
  });

  useEffect(() => {
    void loadOffers();
    const t = setInterval(() => void loadOffers(), 4000);
    return () => clearInterval(t);
  }, [loadOffers]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCoords(next);
        if (driverId && driver?.is_online) {
          void updateDriverLocation(driverId, next.lat, next.lng);
        }
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [driverId, driver?.is_online]);

  const driverLoc =
    coords ??
    (driver?.last_lat != null && driver?.last_lng != null
      ? { lat: driver.last_lat, lng: driver.last_lng }
      : null);

  const nearby = useMemo(() => {
    return offers.filter((o) => {
      const job = o.jobs;
      if (!job?.pickup_lat || !job?.pickup_lng) return true;
      if (!driverLoc) return true;
      return (
        distanceKm(driverLoc, {
          lat: job.pickup_lat,
          lng: job.pickup_lng,
        }) <= RADIUS_KM
      );
    });
  }, [offers, driverLoc]);

  const mapPins = useMemo(
    () =>
      nearby
        .filter(
          (o) =>
            o.jobs?.pickup_lat != null && o.jobs?.pickup_lng != null,
        )
        .map((o) => ({
          id: o.id,
          lat: o.jobs!.pickup_lat!,
          lng: o.jobs!.pickup_lng!,
          label: o.jobs!.reference_code,
        })),
    [nearby],
  );

  const selected = nearby.find((o) => o.id === selectedId) ?? nearby[0] ?? null;

  useEffect(() => {
    if (selected && !nearby.some((o) => o.id === selectedId)) {
      setSelectedId(selected.id);
    }
  }, [nearby, selected, selectedId]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await loadOffers();
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function toggleOnline() {
    if (!driverId || !driver) return;
    const next = !driver.is_online;
    run(async () => {
      let lat = coords?.lat;
      let lng = coords?.lng;
      if (next && navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((res, rej) =>
            navigator.geolocation.getCurrentPosition(res, rej, {
              enableHighAccuracy: true,
              timeout: 8000,
            }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          setCoords({ lat, lng });
        } catch {
          /* Engcobo default in action */
        }
      }
      await setDriverOnline(driverId, next, lat, lng);
      if (next && isFirebaseClientConfigured()) {
        try {
          const token = await requestFcmToken();
          if (token) await saveDriverFcmToken(driverId, token);
        } catch {
          /* optional */
        }
      }
    });
  }

  const job = selected?.jobs;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[45] flex flex-col bg-[#F9FAFB]"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))" }}
    >
      {driverId ? <DriverPushPrompt driverId={driverId} /> : null}

      <div className="relative min-h-0 flex-1">
        <DriverJobsMap
          driverLocation={driverLoc}
          jobs={mapPins}
          onSelectJob={setSelectedId}
        />

        <button
          type="button"
          disabled={pending}
          onClick={toggleOnline}
          className={`absolute top-4 left-1/2 z-[500] -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-md transition active:scale-95 disabled:opacity-60 ${
            driver?.is_online
              ? "bg-emerald-600"
              : "bg-slate-900"
          }`}
        >
          {driver?.is_online ? "Go Offline" : "Go Online"}
        </button>

        {!driver?.is_online ? (
          <p className="absolute bottom-28 left-4 right-4 z-[500] rounded-xl bg-white/95 px-3 py-2 text-center text-xs text-slate-600 shadow-sm">
            Go online to receive job requests nearby
          </p>
        ) : null}
      </div>

      <div className="z-[500] shrink-0 rounded-t-3xl border-t border-gray-100 bg-white px-4 pb-4 pt-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
        {error ? (
          <p className="mb-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {!driver?.is_online ? (
          <p className="py-4 text-center text-sm text-slate-500">
            You&apos;re offline. Tap <strong>Go Online</strong> to see requests.
          </p>
        ) : !job ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No pending jobs within {RADIUS_KM} km. Stay online — new requests
            appear here.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[#1A4D3A] uppercase">
                  {SERVICE_LABELS[job.service_type]} · {job.reference_code}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {job.pickup_landmark}
                  <span className="mx-1 font-normal text-slate-400">→</span>
                  {job.dropoff_landmark}
                </p>
              </div>
              <p className="text-lg font-bold text-[#1A4D3A]">
                {formatMoney(Number(job.fee_amount))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => acceptOffer(job.id, driverId!))
                }
                className="rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white transition active:scale-95 disabled:opacity-60"
              >
                ACCEPT
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run(() => declineOffer(job.id, driverId!))
                }
                className="rounded-xl bg-gray-200 py-3.5 text-sm font-bold text-slate-800 transition active:scale-95 disabled:opacity-60"
              >
                DECLINE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
