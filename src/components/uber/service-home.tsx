"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { filterLandmarkSuggestions } from "@/lib/landmarks";

const services = [
  {
    href: "/ride",
    title: "Village Ride",
    subtitle: "Night rides & direct village-to-village",
    bg: "#E3F2FD",
    icon: "🚗",
  },
  {
    href: "/delivery",
    title: "Village Delivery",
    subtitle:
      "Town & Village Delivery: Store-to-home or person-to-person. Fridges, furniture, building materials.",
    bg: "#E8F5E9",
    icon: "🚚",
  },
  {
    href: "/farm",
    title: "Farm Connect",
    subtitle:
      "Farm & Regional Logistics: Produce, livestock, and equipment transport anywhere.",
    bg: "#FFF3E0",
    icon: "🚜",
  },
] as const;

export function ServiceHomeSheet() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const suggestions = useMemo(
    () => filterLandmarkSuggestions(query),
    [query],
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F5F5F5] px-3 py-3.5 shadow-sm">
          <span className="text-lg text-[#1A4D3A]" aria-hidden>
            ⌕
          </span>
          <input
            className="w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
            placeholder="Enter landmark or village name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            autoComplete="off"
          />
        </div>
        {focused ? (
          <ul className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-[#E3F2FD]"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setQuery(s);
                    setFocused(false);
                  }}
                >
                  {s}
                </button>
              </li>
            ))}
            {query.trim() ? (
              <li>
                <Link
                  href={`/ride?to=${encodeURIComponent(query.trim())}`}
                  className="block px-3 py-2.5 text-sm font-semibold text-[#1A4D3A] hover:bg-[#E8F5E9]"
                >
                  Go to “{query.trim()}” with Village Ride →
                </Link>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <div>
        <h2 className="text-base font-bold text-[#1A4D3A]">Select a service</h2>
        <div className="mt-3 space-y-3">
          {services.map((s) => (
            <Link
              key={s.href}
              href={
                query.trim()
                  ? `${s.href}?to=${encodeURIComponent(query.trim())}`
                  : s.href
              }
              className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
              style={{
                backgroundColor: s.bg,
                borderRadius: 12,
                padding: 16,
                marginBottom: 0,
              }}
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/80 text-2xl"
                aria-hidden
              >
                {s.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-[#1A4D3A]">
                  {s.title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600">
                  {s.subtitle}
                </span>
              </span>
              <span className="text-xl font-light text-[#1A4D3A]" aria-hidden>
                ›
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-1 text-sm">
        <Link href="/driver" className="font-semibold text-[#1A4D3A] underline">
          Drive with us
        </Link>
        <Link href="/shops" className="font-semibold text-[#1A4D3A] underline">
          Shop delivery
        </Link>
        <Link href="/dispatch" className="font-semibold text-slate-500 underline">
          Ops
        </Link>
      </div>
    </div>
  );
}
