"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { MapPin } from "lucide-react";
import { DEFAULT_MAP_CENTER } from "@/lib/landmarks";

const PinMap = dynamic(
  () => import("@/components/location/pin-map-inner").then((m) => m.PinMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-48 items-center justify-center rounded-xl bg-[#E8EEE9] text-sm text-[#1A4D3A]">
        Loading map…
      </div>
    ),
  },
);

type Props = {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
};

export function LocationPinPicker({ lat, lng, onChange }: Props) {
  const [hint, setHint] = useState<string | null>(null);

  const useGps = useCallback(() => {
    setHint(null);
    if (!navigator.geolocation) {
      setHint("GPS not available — tap the map instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(pos.coords.latitude, pos.coords.longitude),
      () => setHint("Could not get GPS — tap the map to place a pin."),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-[var(--ru-muted)] uppercase">
          Pin on map
        </p>
        <button
          type="button"
          onClick={useGps}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1A4D3A]"
        >
          <MapPin className="h-3.5 w-3.5" /> Use my GPS
        </button>
      </div>
      <PinMap
        lat={lat ?? DEFAULT_MAP_CENTER.lat}
        lng={lng ?? DEFAULT_MAP_CENTER.lng}
        hasPin={lat != null && lng != null}
        onPick={onChange}
      />
      <p className="text-xs text-[var(--ru-muted)]">
        Tap the map to place the pin
        {lat != null && lng != null
          ? ` · ${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : ""}
      </p>
      {hint ? <p className="text-xs text-rose-600">{hint}</p> : null}
    </div>
  );
}
