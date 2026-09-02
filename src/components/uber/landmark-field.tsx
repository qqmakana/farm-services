"use client";

import { useState } from "react";
import {
  PlacesAutocomplete,
  type PlaceValue,
} from "@/components/uber/places-autocomplete";
import { DescribePlaceExamples } from "@/components/location/describe-place-examples";
import { SavedPlacesChips } from "@/components/location/saved-places-chips";
import { ButtonSpinner } from "@/components/ui/button-spinner";
import { ensureLocationConsent } from "@/lib/location-consent";

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
        <p className="text-[11px] font-medium text-[#6b6b6b]">Pin set — drag the map to adjust</p>
      ) : !compact && loc.landmark.trim() ? (
        <p className="text-[11px] font-medium text-[#6b6b6b]">
          Tap the map to drop a pin for this place
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
    if (!ensureLocationConsent()) {
      setGpsError("Location is optional — type a landmark or tap the map.");
      return;
    }
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
        setGpsError("Village Ride needs your location to find nearby drivers.");
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
        {loading ? <ButtonSpinner dark /> : "Refresh my GPS location"}
      </button>
      {gpsError ? (
        <div className="mt-2 space-y-2">
          <p className="text-[12px] text-[#666666]">{gpsError}</p>
          <button
            type="button"
            onClick={captureGps}
            className="uber-press uber-btn-outline h-11 min-h-11 w-full text-sm"
          >
            Open Settings
          </button>
        </div>
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
