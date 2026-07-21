"use client";

import { useState } from "react";
import {
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";

export type Loc = {
  lat: number | null;
  lng: number | null;
  landmark: string;
};

export function emptyLoc(): Loc {
  return { lat: null, lng: null, landmark: "" };
}

function locToPlace(loc: Loc): PlaceValue {
  return { label: loc.landmark, lat: loc.lat, lng: loc.lng };
}

function placeToLoc(v: PlaceValue): Loc {
  return { landmark: v.label, lat: v.lat, lng: v.lng };
}

export function LandmarkField({
  label,
  placeholder,
  loc,
  onChange,
  required = true,
  preferVillages = false,
  showSaved = true,
}: {
  label: string;
  placeholder: string;
  loc: Loc;
  onChange: (loc: Loc) => void;
  required?: boolean;
  preferVillages?: boolean;
  showSaved?: boolean;
}) {
  return (
    <div className="space-y-2">
      {showSaved ? (
        <SavedPlacesChips
          onSelect={(v) => onChange(placeToLoc(v))}
        />
      ) : null}
      <PlacesAutocomplete
        label={label}
        placeholder={placeholder}
        value={locToPlace(loc)}
        onChange={(v) => onChange(placeToLoc(v))}
        required={required}
        preferVillages={preferVillages}
      />
    </div>
  );
}

export function useGpsPin(
  onPin: (coords: { lat: number; lng: number }) => void,
) {
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function captureGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS not available — pick a village instead");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setGpsError("GPS not available — pick a village instead");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  return { captureGps, gpsError, loading };
}

export function GpsButton({
  onPin,
}: {
  onPin: (coords: { lat: number; lng: number }) => void;
}) {
  const { captureGps, gpsError, loading } = useGpsPin(onPin);
  return (
    <div>
      <button
        type="button"
        onClick={captureGps}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1A4D3A]/25 bg-[#E8F5E9] px-3 py-3 text-sm font-semibold text-[#1A4D3A] transition hover:bg-[#d7ecd9] active:scale-95 disabled:opacity-60"
      >
        <span aria-hidden>◎</span>
        {loading ? "Getting location…" : "Use my current location"}
      </button>
      {gpsError ? (
        <p className="mt-1.5 text-xs text-amber-800">{gpsError}</p>
      ) : null}
    </div>
  );
}

export function LandmarkHelperText() {
  return (
    <p className="text-xs text-slate-500">
      Search towns &amp; landmarks — no street address needed. Map pin is
      optional; a clear description works for drivers.
    </p>
  );
}
