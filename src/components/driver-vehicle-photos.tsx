"use client";

import { useEffect, useState } from "react";
import { getDriverDisplayPhotos } from "@/lib/actions";
import {
  driverInitials,
  vehicleDisplayLabel,
} from "@/lib/driver-display";
import type { Driver } from "@/lib/types";

type DriverPhotoFields = Pick<
  Driver,
  | "full_name"
  | "selfie_url"
  | "vehicle_front_url"
  | "vehicle_type"
  | "vehicle_color"
  | "vehicle_make"
  | "vehicle_model"
  | "vehicle_registration"
>;

type Props = {
  driver: DriverPhotoFields;
  /** compact = trip/order card; profile = account page */
  variant?: "compact" | "profile";
  className?: string;
};

/**
 * Round driver avatar + rectangular vehicle photo.
 * Resolves private storage paths to signed URLs; falls back to initials.
 */
export function DriverVehiclePhotos({
  driver,
  variant = "compact",
  className = "",
}: Props) {
  const [selfie, setSelfie] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void getDriverDisplayPhotos({
      selfie_url: driver.selfie_url,
      vehicle_front_url: driver.vehicle_front_url,
    })
      .then((urls) => {
        if (cancelled) return;
        setSelfie(urls.selfie);
        setVehicle(urls.vehicle);
      })
      .catch(() => {
        if (cancelled) return;
        setSelfie(null);
        setVehicle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [driver.selfie_url, driver.vehicle_front_url]);

  const initials = driverInitials(driver.full_name);
  const vehicleLabel = vehicleDisplayLabel(driver);
  const plate = driver.vehicle_registration?.trim();

  if (variant === "profile") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-4">
          <Avatar src={selfie} initials={initials} size="lg" loading={loading} />
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
              Driver
            </p>
            <p className="truncate text-lg font-bold text-black">
              {driver.full_name}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
            Vehicle
          </p>
          <VehicleCard
            src={vehicle}
            label={vehicleLabel}
            plate={plate}
            loading={loading}
            tall
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
          Driver: {driver.full_name.split(/\s+/)[0]}
        </p>
        <div className="flex items-center gap-2">
          <Avatar src={selfie} initials={initials} size="md" loading={loading} />
          <p className="truncate text-sm font-semibold text-black">
            {driver.full_name}
          </p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
          Vehicle: {vehicleLabel}
        </p>
        <VehicleCard
          src={vehicle}
          label={vehicleLabel}
          plate={plate}
          loading={loading}
        />
      </div>
    </div>
  );
}

function Avatar({
  src,
  initials,
  size,
  loading,
}: {
  src: string | null;
  initials: string;
  size: "md" | "lg";
  loading: boolean;
}) {
  const dim = size === "lg" ? "h-16 w-16 text-2xl" : "h-12 w-12 text-lg";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <span
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full bg-black font-bold text-white ${
        loading ? "opacity-60" : ""
      }`}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function VehicleCard({
  src,
  label,
  plate,
  loading,
  tall,
}: {
  src: string | null;
  label: string;
  plate?: string | null;
  loading: boolean;
  tall?: boolean;
}) {
  const h = tall ? "h-36" : "h-20";
  return (
    <div
      className={`overflow-hidden rounded-xl border border-[var(--ru-line)] bg-[#f5f5f5] ${h}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div
          className={`flex h-full flex-col items-center justify-center px-2 text-center ${
            loading ? "opacity-50" : ""
          }`}
        >
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          {plate ? (
            <span className="mt-0.5 font-mono text-[10px] tracking-wider text-slate-500">
              {plate}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
