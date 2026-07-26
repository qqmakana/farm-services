import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import {
  GLOBAL_COUNTRY_COUNT,
  MARKET_REGIONS_LABEL,
  enabledCountries,
  paymentLabel,
} from "@/lib/countries";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Available in ${GLOBAL_COUNTRY_COUNT} countries | ${BRAND.appName}`,
  description: `Village Ride — rural transport across ${MARKET_REGIONS_LABEL}. Landmark booking, cash payment, fair driver earnings. Not a US/UK city app.`,
};

export default function CountriesPage() {
  const countries = enabledCountries();

  return (
    <>
      <SiteNav />
      <main className="min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {MARKET_REGIONS_LABEL}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#1A4D3A] sm:text-4xl">
            Village Ride — {GLOBAL_COUNTRY_COUNT} countries, 3 continents
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            We serve villages — not Uber cities. Landmark booking, cash
            economies, and fair driver pay matter in {MARKET_REGIONS_LABEL}. We
            are not launching in the US, UK, or other saturated developed markets
            where street addresses and cards already dominate.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-medium text-[#1A4D3A]">
            <li className="rounded-full bg-[#E8F5E9] px-3 py-1">
              Landmark booking
            </li>
            <li className="rounded-full bg-[#E8F5E9] px-3 py-1">Cash first</li>
            <li className="rounded-full bg-[#E8F5E9] px-3 py-1">
              Drivers keep ~85%
            </li>
            <li className="rounded-full bg-[#E8F5E9] px-3 py-1">
              Ride · Delivery · Farm · Courier
            </li>
          </ul>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {countries.map((c) => (
              <article
                key={c.code}
                className="rounded-2xl border border-slate-200 bg-[#fafafa] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900">
                      {c.name}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {c.currencySymbol} ({c.currency}) · from{" "}
                      {c.currencySymbol}
                      {c.pricing.ride.base} + {c.currencySymbol}
                      {c.pricing.ride.perKm}/km
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Pay:{" "}
                      {c.payments.map((p) => paymentLabel(p)).join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Languages:{" "}
                      {c.languages.map((l) => l.label).join(", ")}
                    </p>
                    {c.localRideModes.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-[#1A4D3A]">
                        Local:{" "}
                        {c.localRideModes.map((m) => m.label).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#1A4D3A] px-4 py-3.5 text-sm font-bold text-white"
            >
              Open Village Ride
            </Link>
            <Link
              href="/driver/join"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#1A4D3A] px-4 py-3.5 text-sm font-bold text-[#1A4D3A]"
            >
              Become a driver
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
