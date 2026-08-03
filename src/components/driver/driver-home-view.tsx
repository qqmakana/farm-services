"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
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
import { OutOfFuelPanel } from "@/components/driver/out-of-fuel-panel";
import { PickupDescribeCard } from "@/components/driver/pickup-describe-card";
import { RiderSpottingCard } from "@/components/driver/rider-spotting-card";
import { DriverPushPrompt } from "@/components/driver-push-prompt";
import {
  isFirebaseClientConfigured,
  requestFcmToken,
} from "@/lib/firebase/client";
import { BRAND } from "@/lib/brand";
import { formatMoney, SERVICE_LABELS } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { pickupPhotoFromDetails } from "@/lib/pickup-photo";
import { useDriverOffersRealtime } from "@/lib/use-driver-offers-realtime";
import {
  buildSimpleWalletTopUpMessage,
  walletTopUpWhatsAppHref,
} from "@/lib/whatsapp";
import {
  isApproachingCreditLimit,
  walletCreditFloor,
} from "@/lib/wallet";
import {
  getDriverVerificationUiStatus,
  VERIFICATION_BLOCK_MESSAGE,
} from "@/components/driver/driver-verification-status-chip";
import type { JobApplication } from "@/lib/types";

const DriverJobsMap = dynamic(
  () =>
    import("@/components/maps/driver-jobs-map").then((m) => m.DriverJobsMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#f5f5f5] text-sm text-[#000000]">
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
    if (next && getDriverVerificationUiStatus(driver) !== "verified") {
      setError(VERIFICATION_BLOCK_MESSAGE);
      return;
    }
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
  const verificationBlocked =
    Boolean(driver) && getDriverVerificationUiStatus(driver!) !== "verified";

  return (
    <div
      className="fixed top-0 left-1/2 z-[45] flex w-full max-w-md -translate-x-1/2 flex-col bg-[#F9FAFB]"
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
          aria-disabled={verificationBlocked && !driver?.is_online}
          title={
            verificationBlocked && !driver?.is_online
              ? VERIFICATION_BLOCK_MESSAGE
              : undefined
          }
          className={`absolute top-4 left-1/2 z-[500] flex min-h-12 min-w-[200px] -translate-x-1/2 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold shadow-lg transition active:scale-95 disabled:opacity-60 ${
            driver?.is_online
              ? "bg-[var(--ru-success)] text-white"
              : verificationBlocked
                ? "bg-black/50 text-white"
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
            {verificationBlocked
              ? VERIFICATION_BLOCK_MESSAGE
              : "Go online to receive job requests nearby"}
          </p>
        ) : null}
      </div>

      <div className="ru-sheet z-[500] shrink-0 border-t border-[var(--ru-line)] px-4 pb-4 pt-3">
        <div className="ru-sheet-handle mb-3" />
        {driver ? (
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--ru-muted)]">
              <span>
                Wallet{" "}
                <strong
                  data-testid="wallet-balance"
                  className={
                    Number(driver.wallet_balance ?? 0) < 0
                      ? "text-[var(--ru-error)]"
                      : "text-black"
                  }
                >
                  {formatMoney(Number(driver.wallet_balance ?? 0))}
                </strong>
              </span>
              <span>
                ★{" "}
                <strong className="text-black">
                  {Number(driver.rating_avg || 0).toFixed(1)}
                </strong>
              </span>
            </div>
            {Number(driver.wallet_balance ?? 0) <
              walletCreditFloor(driver.country_code) ? (
              <div
                data-testid="wallet-warning"
                className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2.5"
              >
                <p className="text-xs font-semibold text-rose-900">
                  Credit limit reached — top up to go online again.
                </p>
                <a
                  href={walletTopUpWhatsAppHref(
                    BRAND.phoneWhatsApp,
                    buildSimpleWalletTopUpMessage(driver.id),
                  )}
                  target="_blank"
                  rel="noreferrer"
                  data-testid="top-up-wallet-button"
                  className="block rounded-xl bg-[#25D366] px-3 py-2 text-center text-xs font-bold text-white"
                >
                  Top Up Wallet on WhatsApp
                </a>
              </div>
            ) : isApproachingCreditLimit(
                Number(driver.wallet_balance ?? 0),
                driver.country_code,
              ) ? (
              <a
                href="/driver/earnings"
                data-testid="wallet-warning"
                className="block rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-semibold text-amber-950"
              >
                Approaching {formatMoney(walletCreditFloor(driver.country_code))}{" "}
                credit limit — top up soon →
              </a>
            ) : null}
          </div>
        ) : null}
        {error ? (
          <p className="mb-2 rounded-2xl bg-[#fdecea] px-3 py-2 text-sm text-[#b01000]">
            {error}
          </p>
        ) : null}

        {driverId ? (
          <div className="mb-3">
            <OutOfFuelPanel
              driverId={driverId}
              coords={driverLoc}
              countryCode={undefined}
            />
          </div>
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
                <div className="mt-2">
                  <PickupDescribeCard
                    pickup={job.pickup_landmark}
                    dropoff={job.dropoff_landmark}
                    photoUrl={pickupPhotoFromDetails(job.details)}
                    pickupLat={job.pickup_lat}
                    pickupLng={job.pickup_lng}
                    dropoffLat={job.dropoff_lat}
                    dropoffLng={job.dropoff_lng}
                    customerPhone={job.customer_phone}
                    customerName={job.customer_name}
                  />
                </div>
                {job.service_type === "courier" ? (
                  <p className="mt-1 text-xs text-[var(--ru-muted)]">
                    Package:{" "}
                    {String(
                      (job.details as Record<string, unknown>)
                        .item_description ?? "—",
                    )}
                    {(job.details as Record<string, unknown>).item_weight
                      ? ` · ${
                          (job.details as Record<string, unknown>)
                            .item_weight === "under_5"
                            ? "<5kg"
                            : (job.details as Record<string, unknown>)
                                  .item_weight === "5_10"
                              ? "5–10kg"
                              : (job.details as Record<string, unknown>)
                                    .item_weight === "10_20"
                                ? "10–20kg"
                                : String(
                                    (job.details as Record<string, unknown>)
                                      .item_weight,
                                  )
                        }`
                      : ""}
                    {" · keep ~85%"}
                  </p>
                ) : null}
                {job.service_type === "ride" ? (
                  <div className="mt-2">
                    <RiderSpottingCard
                      customerName={job.customer_name}
                      details={job.details}
                    />
                  </div>
                ) : null}
              </div>
              <p className="text-lg font-bold text-black">
                {formatMoney(Number(job.fee_amount))}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                aria-disabled={verificationBlocked}
                title={
                  verificationBlocked
                    ? VERIFICATION_BLOCK_MESSAGE
                    : undefined
                }
                onClick={() => {
                  if (verificationBlocked) {
                    setError(VERIFICATION_BLOCK_MESSAGE);
                    return;
                  }
                  run(() => acceptOffer(job.id, driverId!));
                }}
                className={`ru-btn ru-btn-brand !rounded-full py-3.5 text-sm font-bold ${
                  verificationBlocked ? "opacity-50" : ""
                }`}
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
        <p className="mt-3 text-center text-xs text-[var(--ru-muted)]">
          <Link
            href="/driver/group"
            className="font-semibold text-black underline underline-offset-2"
          >
            Group rides
          </Link>
          {" · "}
          <Link
            href="/driver/jobs"
            className="font-semibold text-black underline underline-offset-2"
          >
            Trip history
          </Link>
        </p>
      </div>
    </div>
  );
}
