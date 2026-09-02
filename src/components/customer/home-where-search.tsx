"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import { SmartSuggestions } from "@/components/rider/smart-suggestions";
import { EmptyState } from "@/components/ui/empty-state";
import { searchAddressesAction } from "@/lib/actions-mapbox";
import type { AddressSuggestion } from "@/lib/mapbox-types";
import type { PlaceSuggestion } from "@/lib/suggestions";
import { trackClientEvent } from "@/lib/actions-ops";
import { useDelayedUnmount } from "@/hooks/use-delayed-unmount";

export function HomeWhereSearch({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (place: PlaceSuggestion) => void;
}) {
  const { countryCode } = useCountry();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mounted, leaving } = useDelayedUnmount(open, 300);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHits([]);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

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
      void searchAddressesAction(q, countryCode, null)
        .then((res) => setHits(res.results))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query, open, countryCode]);

  if (!mounted) return null;

  function goHit(hit: AddressSuggestion) {
    void trackClientEvent("search_destination", { label: hit.label });
    onPick({
      type: "nearby",
      id: hit.id,
      name: hit.label.split(",")[0] || hit.label,
      address: hit.label,
      lat: hit.lat,
      lng: hit.lng,
    });
  }

  async function confirmTyped() {
    const q = query.trim();
    if (q.length < 2) return;
    try {
      const res = await searchAddressesAction(q, countryCode, null);
      const hit = res.results[0];
      if (hit) goHit(hit);
    } catch {
      /* keep typing */
    }
  }

  if (!mounted) return null;

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
          className="uber-press uber-press-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={2} aria-hidden />
        </button>
      </div>

      <div className="mx-4 rounded-xl border border-[#0a0a0a] bg-white px-3 py-1">
        <div className="flex gap-3">
          <div className="flex w-3 shrink-0 flex-col items-center pt-4 pb-4">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full border-[2.5px] border-[#0a0a0a] bg-white"
              aria-hidden
            />
            <span className="my-1 w-px flex-1 bg-[#d0d0d0]" aria-hidden />
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-[#0a0a0a]"
              aria-hidden
            />
          </div>
          <div className="min-w-0 flex-1 divide-y divide-[#e8e8e8]">
            <p className="min-h-12 py-3 text-[16px] font-medium text-[#6B6B6B]">
              Current location
            </p>
            <div className="flex min-h-12 items-center gap-2 py-3">
              <Search
                className="h-4 w-4 shrink-0 text-[#6B6B6B]"
                strokeWidth={2}
                aria-hidden
              />
              <input
                ref={inputRef}
                data-testid="home-where-input"
                className="w-full bg-transparent text-[18px] font-semibold text-black outline-none placeholder:font-normal placeholder:text-[#A6A6A6] focus:outline-none"
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
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-8">
        {hits.length > 0 ? (
          <ul className="vr-stagger mt-2 divide-y divide-[#eee]">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goHit(hit)}
                  className="uber-press flex min-h-14 w-full items-start px-4 py-3 text-left"
                >
                  <span className="mt-1 mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEEEEE] text-[#6B6B6B]">
                    <Search className="h-4 w-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">
                      {hit.label.split(",")[0]}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-[#6B6B6B]">
                      {hit.label}
                    </span>
                  </span>
                  <span
                    className="ml-auto shrink-0 text-[18px] text-[#C4C4C4]"
                    aria-hidden
                  >
                    ›
                  </span>
                </button>
              </li>
            ))}
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
            showNearby={false}
            onSelectDestination={onPick}
          />
        )}
      </div>
    </div>
  );
}
