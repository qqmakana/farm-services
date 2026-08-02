import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import {
  GLOBAL_COUNTRY_COUNT,
  MARKET_REGIONS_LABEL,
  enabledCountries,
  featuredCountries,
  paymentLabel,
} from "@/lib/countries";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Available in ${GLOBAL_COUNTRY_COUNT} countries | ${BRAND.appName}`,
  description: `Village Ride — rural transport across ${MARKET_REGIONS_LABEL}. Landmark booking, cash to driver, fair driver earnings.`,
};

export default function CountriesPage() {
  const featured = featuredCountries();
  const all = enabledCountries();

  return (
    <>
      <SiteNav active="countries" />
      <main className="ru-force-light min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Global · {MARKET_REGIONS_LABEL}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[#000000] sm:text-4xl">
            Village Ride — {GLOBAL_COUNTRY_COUNT} countries
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-600">
            Landmark booking and cash payment to your driver — from villages in
            South Africa to towns across {MARKET_REGIONS_LABEL}. Pick your
            country in the app to see local prices.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2 text-sm font-medium text-[#000000]">
            <li className="rounded-full bg-[#f5f5f5] px-3 py-1">
              Landmark booking
            </li>
            <li className="rounded-full bg-[#f5f5f5] px-3 py-1">
              Cash to driver
            </li>
            <li className="rounded-full bg-[#f5f5f5] px-3 py-1">
              Drivers keep ~85%
            </li>
            <li className="rounded-full bg-[#f5f5f5] px-3 py-1">
              Ride · Delivery · Farm · Courier
            </li>
          </ul>

          <h2 className="mt-10 text-lg font-bold text-slate-900">
            Featured markets
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {featured.map((c) => (
              <article
                key={c.code}
                className="rounded-2xl border border-slate-200 bg-[#fafafa] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {c.currencySymbol} ({c.currency}) · from{" "}
                      {c.currencySymbol}
                      {c.pricing.ride.base}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Pay: {c.payments.map((p) => paymentLabel(p)).join(", ")}
                    </p>
                    {c.localRideModes.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-[#000000]">
                        Local:{" "}
                        {c.localRideModes.map((m) => m.label).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-10 text-lg font-bold text-slate-900">
            All {GLOBAL_COUNTRY_COUNT} countries
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Every market below is selectable in the app country picker.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {all.map((c) => (
              <div
                key={c.code}
                className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm"
              >
                <span className="text-xl" aria-hidden>
                  {c.flag}
                </span>
                <span className="min-w-0 truncate font-medium text-slate-800">
                  {c.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#000000] px-4 py-3.5 text-sm font-bold text-white"
            >
              Open Village Ride
            </Link>
            <Link
              href="/driver/join"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[#000000] px-4 py-3.5 text-sm font-bold text-[#000000]"
            >
              Become a driver
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
