"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { useCountry } from "@/components/country/country-provider";
import type { AppLocale, CountryCode } from "@/lib/countries";
import { t } from "@/lib/i18n";

export function CountrySelector({
  compact = false,
  showLanguage = true,
  locked = false,
}: {
  compact?: boolean;
  showLanguage?: boolean;
  /** Show “Country: South Africa” with lock — no picker. */
  locked?: boolean;
}) {
  const { country, countryCode, locale, setCountry, setLocale, countries } =
    useCountry();

  if (locked) {
    return (
      <div
        data-testid="country-locked"
        className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5 text-sm font-medium text-slate-800"
      >
        <Lock className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
        <span>
          Country: {country.flag} {country.name}
        </span>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <label className="block text-sm font-medium text-slate-700">
        {t("country_label", { locale, country: countryCode })}
        <select
          data-testid="country-select"
          className="ru-soft-field mt-1 text-sm"
          value={countryCode}
          onChange={(e) => setCountry(e.target.value as CountryCode)}
        >
          {countries.map((c) => (
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

/** First-open modal — confirm among operating markets only (defaults to ZA). */
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
              We operate in South Africa, Nigeria, and Kenya. Confirm your
              market for currency, phone prefix, map &amp; pricing.
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
        <div className="mt-4 grid gap-2">
          {countries.map((c) => (
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
