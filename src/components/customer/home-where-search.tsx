"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { PlanYourRideHeader } from "@/components/uber/plan-your-ride-header";
import { WhereToBar } from "@/components/uber/where-to-bar";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import { EmptyState } from "@/components/ui/empty-state";
import {
  reverseGeocodeAction,
  searchAddressesAction,
} from "@/lib/actions-mapbox";
import { distanceKm } from "@/lib/geo";
import type { AddressSuggestion } from "@/lib/mapbox-types";
import type { PlaceSuggestion } from "@/lib/suggestions";
import { formatSuggestionDistance } from "@/lib/suggestions";
import { trackClientEvent } from "@/lib/actions-ops";
import { useDelayedUnmount } from "@/hooks/use-delayed-unmount";

const LAST_GPS_KEY = "vr_last_gps_v1";

function shortLabel(full: string): string {
  const first = full.split(",")[0]?.trim() || full;
  return first.length > 36 ? `${first.slice(0, 34)}…` : first;
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

export function HomeWhereSearch({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (place: PlaceSuggestion, opts?: { whenLater?: boolean }) => void;
}) {
  const { countryCode } = useCountry();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickupLabel, setPickupLabel] = useState("Current location");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [whenLater, setWhenLater] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mounted, leaving } = useDelayedUnmount(open, 300);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHits([]);
    setWhenLater(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);

    const cached = readLastGps();
    if (cached) setGps(cached);

    let cancelled = false;
    async function resolvePickup(pin: { lat: number; lng: number }) {
      writeLastGps(pin);
      if (!cancelled) setGps(pin);
      try {
        const hit = await reverseGeocodeAction(pin.lat, pin.lng, countryCode);
        if (!cancelled && hit?.label) {
          const short = shortLabel(hit.label);
          setPickupLabel(short);
          try {
            sessionStorage.setItem("vr_last_pickup_label_v1", short);
          } catch {
            /* quota */
          }
        }
      } catch {
        /* keep Current location */
      }
    }

    if (cached) void resolvePickup(cached);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          void resolvePickup({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          /* keep cached / fallback label */
        },
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 120_000 },
      );
    }

    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, countryCode]);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = window.setTimeout(() => {
      void searchAddressesAction(q, countryCode, gps)
        .then((res) => setHits(res.results))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query, open, countryCode, gps]);

  if (!mounted) return null;

  function goHit(hit: AddressSuggestion) {
    void trackClientEvent("search_destination", { label: hit.label });
    onPick(
      {
        type: "nearby",
        id: hit.id,
        name: hit.label.split(",")[0] || hit.label,
        address: hit.label,
        lat: hit.lat,
        lng: hit.lng,
        distance:
          gps != null
            ? formatSuggestionDistance(
                distanceKm(gps, { lat: hit.lat, lng: hit.lng }),
              )
            : undefined,
        distance_km:
          gps != null
            ? distanceKm(gps, { lat: hit.lat, lng: hit.lng })
            : undefined,
      },
      { whenLater },
    );
  }

  async function confirmTyped() {
    const q = query.trim();
    if (q.length < 2) return;
    try {
      const res = await searchAddressesAction(q, countryCode, gps);
      const hit = res.results[0];
      if (hit) goHit(hit);
    } catch {
      /* keep typing */
    }
  }

  return (
    <div
      className={`ru-force-light fixed inset-0 z-[80] mx-auto flex max-w-md flex-col bg-white pt-[max(0.5rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] text-black uber-sheet-panel ${
        leaving ? "is-leaving pointer-events-none" : ""
      }`}
      data-testid="home-where-search"
    >
      <div className="flex items-center gap-1 px-2 pb-1">
        <button
          type="button"
          onClick={onClose}
          className="uber-press uber-press-icon absolute left-2 z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
        <div className="w-full px-10">
          <PlanYourRideHeader
            whenMode={whenLater ? "later" : "now"}
            onToggleWhen={() => setWhenLater((v) => !v)}
          />
        </div>
      </div>

      <div className="mx-4 mt-2">
        <WhereToBar
          floating={false}
          bordered={false}
          onAddStop={() => {
            /* multi-stop — wired later; control matches Uber layout */
          }}
          pickupSlot={
            <p
              data-testid="plan-pickup-label"
              className="truncate text-[16px] font-medium tracking-[-0.2px] text-[#000000]"
            >
              {pickupLabel}
            </p>
          }
          dropoffSlot={
            <div className="flex min-h-11 items-center gap-2">
              <input
                ref={inputRef}
                data-testid="home-where-input"
                className="w-full bg-transparent text-[16px] font-medium tracking-[-0.2px] text-[#000000] outline-none ring-0 placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                placeholder="Where to?"
                value={query}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="search"
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void confirmTyped();
                  }
                }}
              />
              {query ? (
                <button
                  type="button"
                  aria-label="Clear"
                  onClick={() => {
                    setQuery("");
                    setHits([]);
                    inputRef.current?.focus();
                  }}
                  className="uber-press flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6B6B6B]"
                >
                  <X className="h-4 w-4" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-8 pt-2">
        {hits.length > 0 ? (
          <ul className="vr-stagger divide-y divide-[#eee]">
            {hits.map((hit) => {
              const km =
                gps != null
                  ? distanceKm(gps, { lat: hit.lat, lng: hit.lng })
                  : null;
              return (
                <li key={hit.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => goHit(hit)}
                    className="uber-press flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex w-12 shrink-0 flex-col items-center gap-0.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EEEEEE] text-[#6B6B6B]">
                        <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                      </span>
                      {km != null ? (
                        <span className="text-[11px] font-medium text-[#6B6B6B]">
                          {formatSuggestionDistance(km)}
                        </span>
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-medium tracking-[-0.2px] text-[#000000]">
                        {hit.label.split(",")[0]}
                      </span>
                      <span className="mt-0.5 block truncate text-[14px] font-normal tracking-[-0.1px] text-[#6B6B6B]">
                        {hit.label}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[18px] text-[#C4C4C4]"
                      aria-hidden
                    >
                      ›
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : searching ? (
          <p className="px-4 pt-8 text-center text-[14px] text-[#666666]">
            Searching…
          </p>
        ) : query.trim().length >= 2 ? (
          <EmptyState
            icon={Search}
            title={`No results for '${query.trim()}'`}
            body="Try a street, shop, or landmark"
          />
        ) : (
          <SmartSuggestions
            filter="for-you"
            showNearby
            onSelectDestination={(place) => onPick(place, { whenLater })}
          />
        )}
      </div>
    </div>
  );
}
