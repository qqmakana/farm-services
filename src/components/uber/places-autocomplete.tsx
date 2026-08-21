"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, LocateFixed, MapPin, Plus, Search } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { AddLocationModal } from "@/components/location/add-location-modal";
import {
  bumpLocationUsage,
  searchCommunityLocations,
} from "@/lib/actions-locations";
import { searchAddressesAction } from "@/lib/actions-mapbox";
import { t } from "@/lib/i18n";
import type { AddressSuggestion } from "@/lib/mapbox-types";
import { isInServiceArea } from "@/lib/service-area";
import type { CommunityLocation } from "@/lib/types";

export type PlaceValue = {
  label: string;
  lat: number | null;
  lng: number | null;
  locationId?: string | null;
};

export function emptyPlaceValue(): PlaceValue {
  return { label: "", lat: null, lng: null };
}

type Suggestion =
  | { source: "mapbox"; hit: AddressSuggestion }
  | { source: "community"; loc: CommunityLocation };

export function PlacesAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  required = false,
  showGps = false,
  preferVillages: _preferVillages = false,
  allowAddMissing = true,
  compact = false,
}: {
  label?: string;
  placeholder: string;
  value: PlaceValue;
  onChange: (v: PlaceValue) => void;
  required?: boolean;
  showGps?: boolean;
  preferVillages?: boolean;
  allowAddMissing?: boolean;
  compact?: boolean;
}) {
  const { country, countryCode, locale } = useCountry();
  const [focused, setFocused] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [community, setCommunity] = useState<CommunityLocation[]>([]);
  const [hits, setHits] = useState<AddressSuggestion[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [usedLandmarkFallback, setUsedLandmarkFallback] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [, startSearch] = useTransition();
  const pinnedLabelRef = useRef<string>(
    value.lat != null ? value.label : "",
  );

  useEffect(() => {
    if (value.lat != null && value.lng != null) {
      pinnedLabelRef.current = value.label;
    }
  }, [value.label, value.lat, value.lng]);

  useEffect(() => {
    const q = value.label.trim();
    if (!focused) return;
    if (q.length < 2) {
      setHits([]);
      setNotFound(false);
      setUsedLandmarkFallback(false);
      setSearchError(null);
      setCommunity([]);
      return;
    }
    const timer = window.setTimeout(() => {
      startSearch(() => {
        void searchAddressesAction(
          q,
          countryCode,
          value.lat != null && value.lng != null
            ? { lat: value.lat, lng: value.lng }
            : null,
        )
          .then((res) => {
            setHits(res.results);
            setNotFound(res.notFound);
            setUsedLandmarkFallback(res.usedLandmarkFallback);
            setSearchError(null);
          })
          .catch((err: unknown) => {
            setHits([]);
            setNotFound(false);
            setUsedLandmarkFallback(false);
            setSearchError(
              err instanceof Error ? err.message : "Address search failed.",
            );
          });
        void searchCommunityLocations(q, countryCode, 4)
          .then(setCommunity)
          .catch(() => setCommunity([]));
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [value.label, countryCode, focused, value.lat, value.lng]);

  const suggestions: Suggestion[] = useMemo(() => {
    const fromHits: Suggestion[] = hits.map((hit) => ({
      source: "mapbox" as const,
      hit,
    }));
    if (fromHits.length > 0 && !usedLandmarkFallback) {
      return fromHits;
    }
    const hitLabels = new Set(hits.map((h) => h.label.toLowerCase()));
    const fromCommunity: Suggestion[] = community
      .filter((loc) => {
        const name = `${loc.name} · ${loc.village}`.toLowerCase();
        if (hitLabels.has(name) || hitLabels.has(loc.name.toLowerCase())) {
          return false;
        }
        if (loc.latitude == null || loc.longitude == null) return true;
        return isInServiceArea(
          { lat: loc.latitude, lng: loc.longitude },
          countryCode,
        );
      })
      .map((loc) => ({ source: "community" as const, loc }));
    return [...fromHits, ...fromCommunity].slice(0, 10);
  }, [hits, community, usedLandmarkFallback, countryCode]);

  const showEmptyAdd =
    allowAddMissing &&
    focused &&
    value.label.trim().length >= 2 &&
    (notFound || suggestions.length === 0);

  const showList =
    focused &&
    (suggestions.length > 0 || showEmptyAdd || notFound || Boolean(searchError));

  function selectHit(hit: AddressSuggestion) {
    onChange({
      label: hit.label,
      lat: hit.lat,
      lng: hit.lng,
    });
    pinnedLabelRef.current = hit.label;
    setFocused(false);
    setNotFound(false);
  }

  function selectCommunity(loc: CommunityLocation) {
    const desc = loc.description?.trim();
    const base = `${loc.name} · ${loc.village}`;
    const nextLabel = desc ? `${base} (${desc})` : base;
    onChange({
      label: nextLabel,
      lat: loc.latitude,
      lng: loc.longitude,
      locationId: loc.id,
    });
    pinnedLabelRef.current = nextLabel;
    setFocused(false);
    void bumpLocationUsage(loc.id);
  }

  function keepTypedPlace() {
    const label = value.label.trim();
    if (!label) return;
    onChange({
      label,
      lat: value.lat,
      lng: value.lng,
      locationId: value.locationId,
    });
    pinnedLabelRef.current = label;
    setFocused(false);
    setNotFound(false);
  }

  function onBlurCommit() {
    window.setTimeout(() => {
      setFocused(false);
    }, 320);
  }

  function useGps() {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError("GPS unavailable — tap the map or search for an address.");
      setFocused(true);
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextLabel = value.label.trim() || "Pinned GPS location";
        onChange({
          label: nextLabel,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        pinnedLabelRef.current = nextLabel;
        setGpsLoading(false);
      },
      () => {
        setGpsError("Couldn’t get GPS — tap the map or search for an address.");
        setGpsLoading(false);
        setFocused(true);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  }

  const hintExample = country.landmarkHints[0] ?? "Near the clinic";
  const pinned = value.lat != null && value.lng != null;

  return (
    <div className="relative">
      {label && !compact ? (
        <label className="mb-1 block text-sm font-semibold text-[#000000]">
          {label}
          {required ? " *" : ""}
        </label>
      ) : null}
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          {!compact ? (
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          ) : null}
          <input
            data-testid={
              /where to|dropoff|destination/i.test(placeholder || "")
                ? "dropoff-input"
                : /current location|pickup/i.test(placeholder || label || "")
                  ? "pickup-input"
                  : undefined
            }
            value={value.label}
            onChange={(e) => {
              const next = e.target.value;
              const keepPin = next === pinnedLabelRef.current && pinned;
              onChange({
                label: next,
                lat: keepPin ? value.lat : null,
                lng: keepPin ? value.lng : null,
                locationId: keepPin ? value.locationId : undefined,
              });
            }}
            onFocus={() => setFocused(true)}
            onBlur={onBlurCommit}
            placeholder={
              placeholder ||
              t("search_places", { locale, country: countryCode })
            }
            required={required}
            className={
              compact
                ? "w-full border-0 bg-transparent p-0 text-[16px] font-semibold text-[#0a0a0a] outline-none ring-0 placeholder:font-medium placeholder:text-[#9a9a9a] focus:border-0 focus:outline-none focus:ring-0"
                : "w-full rounded-xl border border-gray-200 bg-[#F9FAFB] py-3 pr-3 pl-10 text-sm outline-none focus:border-[#000000]"
            }
            autoComplete="off"
          />
        </div>
        {showGps ? (
          <button
            type="button"
            onClick={useGps}
            disabled={gpsLoading}
            className={
              compact
                ? "flex shrink-0 items-center justify-center rounded-lg bg-gray-100 px-2.5 text-[#000000] transition active:scale-[0.98] disabled:opacity-50"
                : "flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-3 text-[#000000] transition active:scale-[0.98] disabled:opacity-50"
            }
            aria-label="Use GPS"
          >
            <LocateFixed className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      {!compact ? (
        <p className="mt-1 text-xs text-slate-500">
          {country.flag} {country.name} — search an address or place (e.g.
          &ldquo;{hintExample}&rdquo;). Tap a result to pin it; we never guess.
        </p>
      ) : null}
      {gpsError ? (
        <p className="mt-1 text-xs text-rose-600">{gpsError}</p>
      ) : null}
      {searchError && focused ? (
        <p className="mt-1 text-xs text-rose-600">{searchError}</p>
      ) : null}
      {notFound && focused && !searchError ? (
        <p
          data-testid="address-not-found"
          className="mt-1 text-xs font-medium text-[#6b6b6b]"
        >
          No exact street match. Pick a suggestion, or keep this name and tap
          the map to drop a pin.
        </p>
      ) : null}
      {showList ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.12)] ring-1 ring-black/[0.06]">
          {suggestions.map((s) =>
            s.source === "mapbox" ? (
              <li key={`m-${s.hit.id}`}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-start gap-3 px-3 py-3 text-left hover:bg-[#f6f6f6]"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => selectHit(s.hit)}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eeeeee]">
                    <MapPin className="h-4 w-4 text-[#0a0a0a]" />
                  </span>
                  <span>
                    <span className="block text-[15px] font-semibold text-[#0a0a0a]">
                      {s.hit.needsConfirmation ? "Did you mean " : ""}
                      {s.hit.label}
                      {s.hit.needsConfirmation ? "?" : ""}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-[#6b6b6b]">
                      {s.hit.source === "typed"
                        ? "Use this name — then tap the map to pin"
                        : s.hit.source === "landmark"
                        ? "Local landmark"
                        : s.hit.needsConfirmation
                          ? "Tap to confirm"
                          : "Suggested place"}
                    </span>
                  </span>
                </button>
              </li>
            ) : (
              <li key={`c-${s.loc.id}`}>
                <button
                  type="button"
                  className="flex min-h-14 w-full items-start gap-3 px-3 py-3 text-left hover:bg-[#f6f6f6]"
                  onMouseDown={(e) => e.preventDefault()}
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => selectCommunity(s.loc)}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eeeeee]">
                    <MapPin className="h-4 w-4 text-[#0a0a0a]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[15px] font-semibold text-[#0a0a0a]">
                      {s.loc.name}
                      {s.loc.is_verified ? (
                        <Check
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-label="Verified"
                        />
                      ) : null}
                    </span>
                    <span className="block text-xs text-slate-500 capitalize">
                      {s.loc.category} · {s.loc.village}
                      {s.loc.description
                        ? ` · ${s.loc.description}`
                        : s.loc.is_verified
                          ? " · Verified"
                          : " · Suggested by user"}
                      {s.loc.latitude == null ? " · Landmark only" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ),
          )}
          {notFound && value.label.trim().length >= 2 ? (
            <li className="border-t border-gray-100">
              <button
                type="button"
                className="flex min-h-12 w-full items-start gap-2 px-3 py-3 text-left text-sm hover:bg-[#f5f5f5]"
                onMouseDown={(e) => e.preventDefault()}
                onPointerDown={(e) => e.preventDefault()}
                onClick={keepTypedPlace}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#000000]" />
                <span>
                  <span className="font-medium text-slate-900">
                    Use “{value.label.trim()}”
                  </span>
                  <span className="block text-xs text-slate-500">
                    Keep this name, then tap the map to pin
                  </span>
                </span>
              </button>
            </li>
          ) : null}
          {(showEmptyAdd ||
            (allowAddMissing &&
              focused &&
              value.label.trim().length >= 2 &&
              notFound)) && (
            <li className="border-t border-gray-100">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-3 text-left text-sm font-semibold text-[#000000] hover:bg-[#f5f5f5]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setFocused(false);
                  setAddOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {notFound || suggestions.length === 0
                  ? "Didn't find it? Add missing location"
                  : "Add missing location"}
              </button>
            </li>
          )}
        </ul>
      ) : null}

      {addOpen ? (
        <AddLocationModal
          initialName={value.label}
          onClose={() => setAddOpen(false)}
          onCreated={(place) => {
            onChange(place);
            pinnedLabelRef.current = place.label;
            setAddOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
