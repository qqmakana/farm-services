import Link from "next/link";
import {
  GLOBAL_COUNTRY_COUNT,
  enabledCountries,
  featuredCountries,
} from "@/lib/countries";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `${GLOBAL_COUNTRY_COUNT} Countries — Drive with ${BRAND.appName}`,
  description: `Drivers wanted worldwide — ${GLOBAL_COUNTRY_COUNT} countries. Keep 90%. Cash & Card. Apply now.`,
  robots: { index: false, follow: false },
};

/** Tall phone-first poster for Instagram / WhatsApp screenshots. */
export default function CountriesSocialPage() {
  const featured = featuredCountries();
  const all = enabledCountries();

  return (
    <main className="ru-force-light min-h-dvh bg-[#F7F5F0] text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-8">
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#000000] uppercase">
            {BRAND.appName}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.75rem] leading-[1.05] font-bold tracking-tight text-[#000000]">
            {GLOBAL_COUNTRY_COUNT} countries
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Global rural logistics — every continent
          </p>
        </header>

        <p className="mt-6 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Featured markets
        </p>
        <div
          className="mt-3 grid grid-cols-6 gap-2"
          aria-label="Featured country flags"
        >
          {featured.map((c) => (
            <div key={c.code} className="text-center" title={c.name}>
              <span className="text-[1.75rem] leading-none" aria-hidden>
                {c.flag}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs font-semibold tracking-wide text-slate-500 uppercase">
          All {GLOBAL_COUNTRY_COUNT} markets
        </p>
        <div
          className="mt-3 grid grid-cols-8 gap-1.5"
          aria-label={`${GLOBAL_COUNTRY_COUNT} country flags`}
        >
          {all.map((c) => (
            <div key={c.code} className="text-center" title={c.name}>
              <span className="text-lg leading-none" aria-hidden>
                {c.flag}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-semibold tracking-wide text-slate-800">
          Ride · Delivery · Farm · Courier
        </p>

        <div className="mt-5 rounded-2xl border border-[#000000]/15 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <ul className="space-y-2.5 text-sm font-semibold text-[#000000]">
            <li>Keep 90% of every trip</li>
            <li>Cash &amp; Card accepted</li>
            <li>Work when you want</li>
            <li>Drivers wanted worldwide</li>
          </ul>
        </div>

        <Link
          href="/driver/join"
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#000000] py-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          Apply to drive
        </Link>

        <p className="mt-4 text-center text-xs text-slate-500">
          https://village-ride.vercel.app/driver/join
        </p>
      </div>
    </main>
  );
}
