"use client";

import { useEffect } from "react";
import { useCountry } from "@/components/country/country-provider";
import type { CountryCode } from "@/lib/countries";
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

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-sm font-medium text-slate-700">
        {t("country_label", { locale, country: countryCode })}
        <select
          className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-sm outline-none focus:border-[#1A4D3A]"
          value={countryCode}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.flag} {c.name} ({c.currencySymbol})
            </option>
          ))}
        </select>
      </label>

      {showLanguage ? (
        <label className="block text-sm font-medium text-slate-700">
          {t("language_label", { locale, country: countryCode })}
          <select
            className="mt-1 w-full rounded-xl border border-gray-200 bg-[#F9FAFB] px-3 py-3 text-sm outline-none focus:border-[#1A4D3A]"
            value={locale}
            onChange={(e) =>
              setLocale(e.target.value as typeof locale)
            }
          >
            <option value="en">English</option>
            <option value={country.language}>{country.languageLabel}</option>
          </select>
        </label>
      ) : null}
    </div>
  );
}

/** First-open modal — confirm country (defaults to ZA if dismissed). */
export function CountryWelcomeModal() {
  const {
    ready,
    needsCountryPick,
    countryCode,
    locale,
    setCountry,
    countries,
  } = useCountry();

  useEffect(() => {
    if (!ready || !needsCountryPick) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setCountry(countryCode);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ready, needsCountryPick, countryCode, setCountry]);

  if (!ready || !needsCountryPick) return null;

  function dismiss() {
    // Keep current default (ZA on first visit) and close — user changed their mind
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
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              id="country-welcome-title"
              className="text-lg font-bold text-[#1A4D3A]"
            >
              {t("select_country", { locale, country: countryCode })}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {t("welcome_country", { locale, country: countryCode })}
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
        <div className="mt-4 grid gap-2">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => setCountry(c.code)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.99] ${
                countryCode === c.code
                  ? "border-[#1A4D3A] bg-[#E8F5E9] text-[#1A4D3A]"
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
          className="mt-4 w-full rounded-xl bg-[#1A4D3A] py-3 text-sm font-bold text-white transition active:scale-95"
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
