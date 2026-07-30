"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useCountry } from "@/components/country/country-provider";
import type { AppLocale, CountryCode } from "@/lib/countries";
import { GLOBAL_COUNTRY_COUNT } from "@/lib/countries";
import { t } from "@/lib/i18n";

export function CountrySelector({
  compact = false,
  showLanguage = true,
}: {
  compact?: boolean;
  showLanguage?: boolean;
}) {
  const { country, countryCode, locale, setCountry, setLocale, countries } =
    useCountry();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.currencySymbol.toLowerCase().includes(q),
    );
  }, [countries, filter]);

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-sm font-medium text-slate-700">
        {t("country_label", { locale, country: countryCode })}
        {!compact ? (
          <input
            className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-[#000000]"
            placeholder={`Search ${GLOBAL_COUNTRY_COUNT} countries…`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        ) : null}
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-sm outline-none focus:border-[#000000]"
          value={countryCode}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {(filter.trim() ? filtered : countries).map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} — {c.currencySymbol}
            </option>
          ))}
        </select>
      </label>

      {showLanguage ? (
        <label className="block text-sm font-medium text-slate-700">
          {t("language_label", { locale, country: countryCode })}
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-sm outline-none focus:border-[#000000]"
            value={locale}
            onChange={(e) =>
              setLocale(e.target.value as AppLocale | "en")
            }
          >
            {country.languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}

/** First-open modal — confirm country (defaults to ZA if dismissed). */
export function CountryWelcomeModal() {
  const pathname = usePathname() ?? "";
  const {
    ready,
    needsCountryPick,
    countryCode,
    locale,
    setCountry,
    countries,
  } = useCountry();
  const [filter, setFilter] = useState("");

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countries, filter]);

  useEffect(() => {
    if (!ready || !needsCountryPick) return;
    if (pathname.startsWith("/onboarding")) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCountry(countryCode);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, needsCountryPick, countryCode, setCountry, pathname]);

  if (!ready || !needsCountryPick) return null;
  if (pathname.startsWith("/onboarding")) return null;

  function dismiss() {
    setCountry(countryCode);
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="country-welcome-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={dismiss}
      />
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              id="country-welcome-title"
              className="text-lg font-bold text-[#000000]"
            >
              {t("select_country", { locale, country: countryCode })}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("welcome_country", { locale, country: countryCode })}{" "}
              ({GLOBAL_COUNTRY_COUNT} countries)
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close without changing"
          >
            ×
          </button>
        </div>
        <input
          className="mt-3 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-2.5 text-sm outline-none focus:border-[#000000]"
          placeholder="Search country…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <div className="mt-3 grid max-h-[45vh] gap-2 overflow-y-auto pr-1">
          {filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.99] ${
                countryCode === c.code
                  ? "border-[#000000] bg-[#f5f5f5] text-[#000000]"
                  : "border-gray-200 bg-white text-slate-800"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {c.flag}
              </span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs font-medium text-slate-500">
                {c.currencySymbol}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCountry(countryCode)}
          className="mt-4 w-full rounded-xl bg-[#000000] py-3 text-sm font-bold text-white transition active:scale-95"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
