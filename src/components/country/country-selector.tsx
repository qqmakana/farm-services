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
            className="ru-soft-field mt-1 !min-h-11 text-sm"
            placeholder={`Search ${GLOBAL_COUNTRY_COUNT} countries…`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        ) : null}
        <select
          className="ru-soft-field mt-1 text-sm"
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
            className="ru-soft-field mt-1 text-sm"
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
      <div className="ru-card relative flex max-h-[85vh] w-full max-w-md flex-col p-5 !shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p
              id="country-welcome-title"
              className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[var(--ru-ink)]"
            >
              {t("select_country", { locale, country: countryCode })}
            </p>
            <p className="mt-1 text-sm text-[var(--ru-muted)]">
              Detected from your device — confirm to lock currency, phone
              prefix, map &amp; pricing. Change later in Account. (
              {GLOBAL_COUNTRY_COUNT} countries)
            </p>
            <p className="mt-2 rounded-xl bg-[var(--ru-elevated)] px-3 py-2 text-xs text-[var(--ru-ink)]">
              Suggested:{" "}
              <strong>
                {countries.find((c) => c.code === countryCode)?.flag}{" "}
                {countries.find((c) => c.code === countryCode)?.name ||
                  countryCode}
              </strong>{" "}
              · {countries.find((c) => c.code === countryCode)?.currencySymbol}
              {countries.find((c) => c.code === countryCode)?.currency}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-[var(--ru-muted)] hover:bg-[var(--ru-elevated)] hover:text-[var(--ru-ink)]"
            aria-label="Close without changing"
          >
            ×
          </button>
        </div>
        <input
          className="ru-soft-field mt-3 text-sm"
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
              className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition active:scale-[0.99] ${
                countryCode === c.code
                  ? "border-[var(--ru-ink)] bg-[var(--ru-elevated)] text-[var(--ru-ink)]"
                  : "border-[var(--ru-line)] bg-white text-[var(--ru-ink)]"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {c.flag}
              </span>
              <span className="flex-1">{c.name}</span>
              <span className="text-xs font-medium text-[var(--ru-muted)]">
                {c.currencySymbol}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setCountry(countryCode)}
          className="ru-btn ru-btn-primary ru-btn-block mt-4"
        >
          Continue
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="ru-btn ru-btn-ghost ru-btn-block mt-1"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
