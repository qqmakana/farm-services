"use client";

import { useState } from "react";
import {
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { DescribePlaceExamples } from "@/components/location/describe-place-examples";
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
  showExamples = false,
  showGps = true,
  compact = false,
}: {
  label: string;
  placeholder: string;
  loc: Loc;
  onChange: (loc: Loc) => void;
  required?: boolean;
  preferVillages?: boolean;
  showSaved?: boolean;
  /** Show “Describe your place” example chips (best for pickup). */
  showExamples?: boolean;
  /** GPS button next to search — map pin stays available too. */
  showGps?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "space-y-2"}>
      {showSaved && !compact ? (
        <SavedPlacesChips
          onSelect={(v) => onChange(placeToLoc(v))}
        />
      ) : null}
      {showExamples && !compact ? (
        <DescribePlaceExamples
          onPick={(text) =>
            onChange({
              ...loc,
              landmark: text,
            })
          }
        />
      ) : null}
      <PlacesAutocomplete
        label={compact ? undefined : label}
        placeholder={placeholder}
        value={locToPlace(loc)}
        onChange={(v) => onChange(placeToLoc(v))}
        required={required}
        preferVillages={preferVillages}
        showGps={compact ? false : showGps}
        compact={compact}
      />
      {!compact && loc.lat != null && loc.lng != null ? (
        <p className="text-[11px] font-medium text-emerald-700">
          Map pin set
        </p>
      ) : !compact && loc.landmark.trim() ? (
        <p className="text-[11px] font-medium text-rose-700">
          Address not pinned — pick a search result or tap the map
        </p>
      ) : null}
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
      setGpsError("GPS unavailable — you can still tap the map or type a landmark.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setGpsError("Couldn’t get GPS — tap the map or type a landmark.");
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#000000]/25 bg-[#f5f5f5] px-3 py-3 text-sm font-semibold text-[#000000] transition hover:bg-[#f5f5f5] active:scale-95 disabled:opacity-60"
      >
        <span aria-hidden>◎</span>
        {loading ? "Updating location…" : "Refresh my GPS location"}
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
      The map centers on you automatically (like Uber). Always add a landmark
      name so drivers can find you if GPS is weak.
    </p>
  );
}
