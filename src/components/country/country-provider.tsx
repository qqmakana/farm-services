"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  enabledCountries,
  getCountry,
  type AppLocale,
  type CountryCode,
  type CountryConfig,
} from "@/lib/countries";
import {
  getStoredCountryCode,
  getStoredLocale,
  hasPickedCountry,
  setStoredCountryCode,
  setStoredLocale,
} from "@/lib/country-preference";
import { detectCountryFromBrowser } from "@/lib/detect-country";
import { getGuestProfile, setGuestProfile } from "@/lib/guest-profile";

type CountryContextValue = {
  country: CountryConfig;
  countryCode: CountryCode;
  locale: AppLocale | "en";
  ready: boolean;
  needsCountryPick: boolean;
  setCountry: (code: CountryCode) => void;
  setLocale: (locale: AppLocale | "en") => void;
  countries: CountryConfig[];
};

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCodeState] =
    useState<CountryCode>("ZA");
  const [locale, setLocaleState] = useState<AppLocale | "en">("en");
  const [ready, setReady] = useState(false);
  const [needsCountryPick, setNeedsPick] = useState(false);

  useEffect(() => {
    const picked = hasPickedCountry();
    if (picked) {
      setCountryCodeState(getStoredCountryCode());
      setNeedsPick(false);
    } else {
      // Auto-detect once, then lock via welcome modal / Continue
      const detected = detectCountryFromBrowser();
      setCountryCodeState(detected);
      setNeedsPick(true);
    }
    setLocaleState(getStoredLocale());
    setReady(true);
  }, []);

  const setCountry = useCallback((code: CountryCode) => {
    setStoredCountryCode(code);
    setCountryCodeState(code);
    setNeedsPick(false);
    const existing = getGuestProfile();
    if (existing?.phone) {
      setGuestProfile({ ...existing, country_code: code });
    }
  }, []);

  const setLocale = useCallback((next: AppLocale | "en") => {
    setStoredLocale(next);
    setLocaleState(next);
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({
      country: getCountry(countryCode),
      countryCode,
      locale,
      ready,
      needsCountryPick,
      setCountry,
      setLocale,
      countries: enabledCountries(),
    }),
    [countryCode, locale, ready, needsCountryPick, setCountry, setLocale],
  );

  return (
    <CountryContext.Provider value={value}>{children}</CountryContext.Provider>
  );
}

export function useCountry() {
  const ctx = useContext(CountryContext);
  if (!ctx) {
    // SSR / outside provider — safe ZA defaults
    return {
      country: getCountry("ZA"),
      countryCode: "ZA" as CountryCode,
      locale: "en" as const,
      ready: false,
      needsCountryPick: false,
      setCountry: (_: CountryCode) => {},
      setLocale: (_: AppLocale | "en") => {},
      countries: enabledCountries(),
    };
  }
  return ctx;
}
