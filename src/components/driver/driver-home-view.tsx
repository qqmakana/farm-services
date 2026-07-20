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
          aria-pressed={Boolean(driver?.is_online)}
          className={`absolute top-4 left-1/2 z-[500] flex min-h-12 min-w-[200px] -translate-x-1/2 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-60 ${
            driver?.is_online
              ? "bg-[var(--ru-success)] text-white"
              : "bg-black text-white"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              driver?.is_online ? "bg-white" : "bg-[var(--ru-muted)]"
            }`}
            aria-hidden
          />
          {driver?.is_online ? "ONLINE" : "OFFLINE"}
        </button>

        {!driver?.is_online ? (
          <p className="absolute bottom-28 left-4 right-4 z-[500] rounded-2xl bg-white/95 px-3 py-2.5 text-center text-xs text-[var(--ru-muted)] shadow-sm">
            Go online to receive job requests nearby
          </p>
        ) : null}
      </div>

      <div className="z-[500] shrink-0 rounded-t-3xl border-t border-[var(--ru-line)] bg-white px-4 pb-4 pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-200" />
        {driver ? (
          <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[var(--ru-muted)]">
            <span>
              Today{" "}
              <strong className="text-black">
                {formatMoney(Number(driver.wallet_balance ?? 0))}
              </strong>{" "}
              wallet
            </span>
            <span>
              ★{" "}
              <strong className="text-black">
                {Number(driver.rating_avg || 0).toFixed(1)}
              </strong>
            </span>
          </div>
        ) : null}
        {error ? (
          <p className="mb-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        {!driver?.is_online ? (
          <p className="py-4 text-center text-sm text-[var(--ru-muted)]">
            You&apos;re offline. Tap <strong className="text-black">ONLINE</strong>{" "}
            to see requests.
          </p>
        ) : !job ? (
          <p className="py-4 text-center text-sm text-[var(--ru-muted)]">
            No pending jobs within {RADIUS_KM} km. Stay online — new requests
            appear here.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
                  {SERVICE_LABELS[job.service_type]} · {job.reference_code}
                </p>
                <p className="mt-1 text-sm font-semibold text-black">
                  {job.pickup_landmark}
                  <span className="mx-1 font-normal text-[var(--ru-muted)]">
                    →
                  </span>
                  {job.dropoff_landmark}
                </p>
              </div>
              <p className="text-lg font-bold text-black">
                {formatMoney(Number(job.fee_amount))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => acceptOffer(job.id, driverId!))}
                className="ru-btn ru-btn-brand !rounded-full py-3.5 text-sm font-bold"
              >
                ACCEPT
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => declineOffer(job.id, driverId!))}
                className="ru-btn ru-btn-secondary !rounded-full py-3.5 text-sm font-bold"
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
