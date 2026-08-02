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
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-3xl px-4 py-10 pb-24">
          <p className="ru-section-label">Global · {MARKET_REGIONS_LABEL}</p>
          <h1 className="ru-page-title mt-2 !text-[2rem] sm:!text-[2.25rem]">
            Available in {GLOBAL_COUNTRY_COUNT} countries
          </h1>
          <p className="ru-page-sub max-w-2xl">
            Landmark booking and cash payment to your driver — from villages in
            South Africa to towns across {MARKET_REGIONS_LABEL}. Pick your
            country in the app to see local prices.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              "Landmark booking",
              "Cash to driver",
              "Drivers keep ~85%",
              "Ride · Delivery · Farm · Courier",
            ].map((label) => (
              <li key={label} className="ru-chip">
                {label}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-lg font-bold text-[var(--ru-ink)]">
            Featured markets
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {featured.map((c) => (
              <article key={c.code} className="ru-card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl" aria-hidden>
                    {c.flag}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-bold text-[var(--ru-ink)]">
                      {c.name}
                    </h3>
                    <p className="mt-0.5 text-sm text-[var(--ru-muted)]">
                      {c.currencySymbol} ({c.currency}) · from{" "}
                      {c.currencySymbol}
                      {c.pricing.ride.base}
                    </p>
                    <p className="mt-2 text-xs text-[var(--ru-muted)]">
                      Pay: {c.payments.map((p) => paymentLabel(p)).join(", ")}
                    </p>
                    {c.localRideModes.length > 0 ? (
                      <p className="mt-1 text-xs font-semibold text-[var(--ru-ink)]">
                        Local:{" "}
                        {c.localRideModes.map((m) => m.label).join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>

          <h2 className="mt-10 text-lg font-bold text-[var(--ru-ink)]">
            All {GLOBAL_COUNTRY_COUNT} countries
          </h2>
          <p className="mt-1 text-sm text-[var(--ru-muted)]">
            Every market below is selectable in the app country picker.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {all.map((c) => (
              <div key={c.code} className="ru-card flex items-center gap-2 px-3 py-2.5 text-sm">
                <span className="text-xl" aria-hidden>
                  {c.flag}
                </span>
                <span className="min-w-0 truncate font-semibold text-[var(--ru-ink)]">
                  {c.name}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/get-app" className="ru-btn ru-btn-primary ru-btn-block">
              Install Village Ride
            </Link>
            <Link href="/driver/join" className="ru-btn ru-btn-secondary ru-btn-block">
              Become a driver
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
