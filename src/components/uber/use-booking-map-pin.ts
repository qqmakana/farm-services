"use client";

import { useCallback, useEffect, useState } from "react";
import { requestCurrentGps } from "@/lib/auto-gps";

/** Shared map pin state — auto-GPS on open (Uber/Bolt style), tap to adjust. */
export function useBookingMapPin(opts?: { autoGps?: boolean }) {
  const autoGps = opts?.autoGps !== false;
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [mapTapPin, setMapTapPin] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [mapTapToken, setMapTapToken] = useState(0);
  const [gpsReady, setGpsReady] = useState(false);

  const applyPin = useCallback((p: { lat: number; lng: number }) => {
    setPin(p);
    setMapTapPin(p);
    setMapTapToken((n) => n + 1);
  }, []);

  // Auto-locate on open — map shows your position without tapping
  useEffect(() => {
    if (!autoGps) return;
    let cancelled = false;
    void requestCurrentGps().then((coords) => {
      if (cancelled) return;
      if (!coords) {
        setGpsReady(true);
        return;
      }
      // Seed map + sheet once — user tap / search can still move the pin later
      setPin((existing) => existing ?? coords);
      setMapTapPin((existing) => {
        if (existing) return existing;
        return coords;
      });
      setMapTapToken((n) => (n === 0 ? 1 : n));
      setGpsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [autoGps]);

  const onMapPin = useCallback(
    (p: { lat: number; lng: number }) => {
      applyPin(p);
    },
    [applyPin],
  );

  return { pin, setPin, mapTapPin, mapTapToken, onMapPin, gpsReady };
}
