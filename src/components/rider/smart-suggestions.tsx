"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Briefcase,
  Building2,
  Clock,
  Fuel,
  GraduationCap,
  Home,
  MapPin,
  Plus,
  ShoppingBag,
  Store,
  Utensils,
  Bus,
} from "lucide-react";
import { getGuestProfile } from "@/lib/guest-profile";
import { useCountry } from "@/components/country/country-provider";
import type {
  HomeFeedTab,
  PlaceSuggestion,
  SuggestionsPayload,
} from "@/lib/suggestions";
import { filterSuggestionsForTab } from "@/lib/suggestions";
import { SavePlaceSheet } from "@/components/rider/save-place-sheet";

const CACHE_MS = 5 * 60 * 1000;
const LAST_GPS_KEY = "vr_last_gps_v1";

function cacheKey(lat: number, lng: number, phone: string) {
  return `vr_suggestions_v1:${phone}:${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

function readCache(key: string): SuggestionsPayload | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: SuggestionsPayload };
    if (Date.now() - parsed.at > CACHE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(key: string, data: SuggestionsPayload) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota */
  }
}

function readLastGps(): { lat: number; lng: number } | null {
  try {
    const raw = sessionStorage.getItem(LAST_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat: number; lng: number };
    if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null;
    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}

function writeLastGps(pin: { lat: number; lng: number }) {
  try {
    sessionStorage.setItem(LAST_GPS_KEY, JSON.stringify(pin));
  } catch {
    /* quota */
  }
}

function CategoryIcon({ category }: { category?: string }) {
  const cls = "h-4 w-4 text-[#6B6B6B]";
  switch (category) {
    case "restaurant":
    case "fast_food":
      return <Utensils className={cls} strokeWidth={2} aria-hidden />;
    case "shop":
    case "grocery":
      return <ShoppingBag className={cls} strokeWidth={2} aria-hidden />;
    case "mall":
      return <Store className={cls} strokeWidth={2} aria-hidden />;
    case "university":
    case "school":
      return <GraduationCap className={cls} strokeWidth={2} aria-hidden />;
    case "hospital":
      return <Plus className={cls} strokeWidth={2} aria-hidden />;
    case "fuel":
      return <Fuel className={cls} strokeWidth={2} aria-hidden />;
    case "bus_station":
      return <Bus className={cls} strokeWidth={2} aria-hidden />;
    case "taxi":
      return <Building2 className={cls} strokeWidth={2} aria-hidden />;
    default:
      return <MapPin className={cls} strokeWidth={2} aria-hidden />;
  }
}

function SuggestionsSkeleton() {
  return (
    <div
      data-testid="smart-suggestions-skeleton"
      className="mt-4 space-y-3 animate-pulse"
    >
      <div className="flex gap-3">
        <div className="h-12 w-24 rounded-full bg-[#EEEEEE]" />
        <div className="h-12 w-24 rounded-full bg-[#EEEEEE]" />
      </div>
      <div className="h-16 rounded-2xl bg-[#F3F3F3]" />
      <div className="h-16 rounded-2xl bg-[#F3F3F3]" />
      <div className="h-16 rounded-2xl bg-[#F3F3F3]" />
    </div>
  );
}

function RowButton({
  place,
  onSelect,
  icon,
}: {
  place: PlaceSuggestion;
  onSelect: (place: PlaceSuggestion) => void;
  icon: ReactNode;
}) {
  const dist = place.distance?.trim() || "";
  return (
    <button
      type="button"
      onClick={() => onSelect(place)}
      className="uber-press flex min-h-12 w-full items-center gap-3 px-4 py-3.5 text-left"
    >
      <span className="flex w-12 shrink-0 flex-col items-center gap-0.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEEEE]">
          {icon}
        </span>
        {dist ? (
          <span className="text-[11px] font-medium leading-tight text-[#6B6B6B]">
            {dist}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[16px] font-medium tracking-[-0.2px] text-[#000000]">
          {place.name}
        </span>
        <span className="mt-0.5 block truncate text-[14px] font-normal tracking-[-0.1px] text-[#6B6B6B]">
          {place.address}
        </span>
      </span>
      <span className="shrink-0 text-[18px] leading-none text-[#C4C4C4]" aria-hidden>
        ›
      </span>
    </button>
  );
}

export function SmartSuggestions({
  onSelectDestination,
  filter = "for-you",
  showNearby = true,
}: {
  onSelectDestination: (place: PlaceSuggestion) => void;
  filter?: HomeFeedTab;
  /** Hardcoded nearby landmarks — only after the user types, not on Home. */
  showNearby?: boolean;
}) {
  const { countryCode } = useCountry();
  const [data, setData] = useState<SuggestionsPayload>({
    saved: [],
    recent: [],
    nearby: [],
  });
  const [loading, setLoading] = useState(true);
  const [saveKind, setSaveKind] = useState<"home" | "work" | null>(null);

  useEffect(() => {
    let cancelled = false;
    const guest = getGuestProfile();
    const phone = guest?.phone || "";

    async function fetchSuggestions(pin?: { lat: number; lng: number }) {
      const key = pin
        ? cacheKey(pin.lat, pin.lng, phone)
        : `vr_suggestions_v1:${phone}:personal`;
      const cached = readCache(key);
      if (cached) {
        if (!cancelled) {
          setData((prev) =>
            pin
              ? cached
              : {
                  saved: cached.saved,
                  recent: cached.recent,
                  nearby: prev.nearby,
                },
          );
          setLoading(false);
        }
      }
      try {
        const res = await fetch("/api/suggestions/nearby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(pin ? { lat: pin.lat, lng: pin.lng } : {}),
            phone,
            countryCode,
          }),
        });
        if (!res.ok) throw new Error("suggestions failed");
        const json = (await res.json()) as SuggestionsPayload;
        writeCache(key, json);
        if (!cancelled) {
          setData((prev) =>
            pin
              ? json
              : {
                  saved: json.saved,
                  recent: json.recent,
                  nearby: prev.nearby,
                },
          );
          setLoading(false);
        }
      } catch {
        if (!cancelled && !cached) setLoading(false);
      }
    }

    void fetchSuggestions();

    if (!showNearby) {
      return () => {
        cancelled = true;
      };
    }

    const lastGps = readLastGps();
    if (lastGps) void fetchSuggestions(lastGps);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const pin = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          writeLastGps(pin);
          void fetchSuggestions(pin);
        },
        () => {
          if (!cancelled) setLoading(false);
        },
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
      );
    } else if (!cancelled) {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [countryCode, showNearby]);

  const shown = filterSuggestionsForTab(data, filter);
  const personal = {
    saved: shown.saved,
    recent: shown.recent,
    nearby: showNearby ? shown.nearby : [],
  };
  const filteredEmpty =
    filter !== "for-you" &&
    personal.saved.length === 0 &&
    personal.recent.length === 0 &&
    personal.nearby.length === 0;
  const display =
    showNearby && filteredEmpty && data.nearby.length > 0
      ? { saved: shown.saved, recent: shown.recent, nearby: data.nearby }
      : personal;
  const hasHome = data.saved.some((p) => p.label === "home");
  const hasWork = data.saved.some((p) => p.label === "work");
  const empty =
    display.saved.length === 0 &&
    display.recent.length === 0 &&
    display.nearby.length === 0;

  if (loading) return <SuggestionsSkeleton />;

  const recents = (
    display.recent.length > 0 ? (
      <ul className="overflow-hidden bg-white" data-testid="home-recents">
        {display.recent.map((place, i) => (
          <li key={place.id}>
            {i > 0 ? <div className="mx-4 h-px bg-[#EEEEEE]" /> : null}
            <RowButton
              place={place}
              onSelect={onSelectDestination}
              icon={<Clock className="h-4 w-4 text-[#6B6B6B]" strokeWidth={2} />}
            />
          </li>
        ))}
      </ul>
    ) : (
      <div data-testid="home-recents" className="sr-only">
        No recent Village Ride trips
      </div>
    )
  );

  const saved = (
    <>
      <h2 className="text-[18px] font-bold leading-snug tracking-[-0.2px] text-black">
        Saved places
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {display.saved.map((place) => {
          const Icon =
            place.label === "home"
              ? Home
              : place.label === "work"
                ? Briefcase
                : MapPin;
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onSelectDestination(place)}
              className="uber-press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-black px-4 text-[14px] font-semibold text-white"
            >
              <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              {place.name}
            </button>
          );
        })}
        {!hasHome ? (
          <button
            type="button"
            data-testid="add-home"
            onClick={() => setSaveKind("home")}
            className="uber-press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#F3F3F3] px-4 text-[14px] font-semibold text-black"
          >
            <Home className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add home
          </button>
        ) : null}
        {!hasWork ? (
          <button
            type="button"
            data-testid="add-work"
            onClick={() => setSaveKind("work")}
            className="uber-press inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-[#F3F3F3] px-4 text-[14px] font-semibold text-black"
          >
            <Briefcase className="h-4 w-4" strokeWidth={2} aria-hidden />
            Add work
          </button>
        ) : null}
      </div>
    </>
  );

  return (
    <div data-testid="smart-suggestions" className="mt-3 space-y-4">
      {recents}
      {saved}

      {display.nearby.length > 0 ? (
        <ul
          className="vr-stagger overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white"
          data-testid="home-nearby"
        >
          <li className="px-4 pt-3 text-[11px] font-semibold tracking-wide text-[#6B6B6B] uppercase">
            {filteredEmpty ? "Nearby places" : "Nearby"}
          </li>
          {display.nearby.map((place, i) => (
            <li key={place.id}>
              {i > 0 ? <div className="mx-4 h-px bg-[#EEEEEE]" /> : null}
              <RowButton
                place={place}
                onSelect={onSelectDestination}
                icon={<CategoryIcon category={place.category} />}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {empty ? (
        <p
          data-testid="for-you-empty"
          className="px-1 py-6 text-center text-[14px] text-[#A6A6A6]"
        >
          {filter === "for-you"
            ? "Tap Where to? or add Home to start"
            : "No suggestions for this service yet — tap Where to? to book"}
        </p>
      ) : null}

      {saveKind ? (
        <SavePlaceSheet
          kind={saveKind}
          onClose={() => setSaveKind(null)}
          onSaved={(place) => {
            setSaveKind(null);
            setData((prev) => ({
              ...prev,
              saved: [
                place,
                ...prev.saved.filter((p) => p.label !== place.label),
              ],
            }));
          }}
        />
      ) : null}
    </div>
  );
}
