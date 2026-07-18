"use client";

import { useMemo, useState } from "react";
import { filterLandmarkSuggestions } from "@/lib/landmarks";

export type Loc = {
  lat: number | null;
  lng: number | null;
  landmark: string;
};

export function emptyLoc(): Loc {
  return { lat: null, lng: null, landmark: "" };
}

export function LandmarkField({
  label,
  placeholder,
  loc,
  onChange,
  required = true,
}: {
  label: string;
  placeholder: string;
  loc: Loc;
  onChange: (loc: Loc) => void;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(
    () => filterLandmarkSuggestions(loc.landmark),
    [loc.landmark],
  );
  const showList = focused && (loc.landmark.length > 0 || true);

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#1A4D3A]">
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
        <input
          required={required}
          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#F5F5F5] px-3 py-3 text-sm text-slate-900 outline-none focus:border-[#1A4D3A] focus:ring-2 focus:ring-[#1A4D3A]/20"
          placeholder={placeholder}
          value={loc.landmark}
          onChange={(e) => onChange({ ...loc, landmark: e.target.value })}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            // Delay so suggestion click can register
            window.setTimeout(() => setFocused(false), 150);
          }}
          autoComplete="off"
        />
      </label>
      {showList && focused ? (
        <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-[#E8F5E9]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ ...loc, landmark: s });
                  setFocused(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-1 text-xs text-slate-500">
        {loc.lat != null && loc.lng != null
          ? `GPS pin set · ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
          : "Landmark only is OK — no street name needed."}
      </p>
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
      setGpsError("GPS not available - landmark is OK");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setGpsError("GPS not available - landmark is OK");
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#1A4D3A]/25 bg-[#E8F5E9] px-3 py-3 text-sm font-semibold text-[#1A4D3A] transition hover:bg-[#d7ecd9] disabled:opacity-60"
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
      No street names? Use landmarks — we understand!
    </p>
  );
}
