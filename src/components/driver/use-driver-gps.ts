"use client";

import { useEffect } from "react";
import { updateDriverLocation } from "@/lib/actions";

export const DRIVER_GPS_INTERVAL_MS = 3000;

/** Push driver GPS to the server every 3 seconds while online. */
export function useDriverGpsPing(
  driverId: string | null | undefined,
  isOnline: boolean,
  onCoords?: (lat: number, lng: number) => void,
) {
  useEffect(() => {
    if (!driverId || !isOnline) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let last: { lat: number; lng: number } | null = null;

    const watch = navigator.geolocation.watchPosition(
      (pos) => {
        last = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onCoords?.(last.lat, last.lng);
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: DRIVER_GPS_INTERVAL_MS },
    );

    const ping = () => {
      if (last) {
        void updateDriverLocation(driverId, last.lat, last.lng);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          last = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onCoords?.(last.lat, last.lng);
          void updateDriverLocation(driverId, last.lat, last.lng);
        },
        () => undefined,
        { enableHighAccuracy: true, timeout: 8000 },
      );
    };

    ping();
    const t = window.setInterval(ping, DRIVER_GPS_INTERVAL_MS);
    return () => {
      navigator.geolocation.clearWatch(watch);
      window.clearInterval(t);
    };
  }, [driverId, isOnline, onCoords]);
}
