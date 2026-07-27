import Link from "next/link";
import {
  GLOBAL_COUNTRY_COUNT,
  MARKET_REGIONS_LABEL,
  enabledCountries,
} from "@/lib/countries";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `${GLOBAL_COUNTRY_COUNT} Countries — Drive with ${BRAND.appName}`,
  description: `Drivers wanted across ${MARKET_REGIONS_LABEL}. Keep 85%. Cash & Card. Apply now.`,
  robots: { index: false, follow: false },
};

/** Tall phone-first poster for Instagram / WhatsApp screenshots. */
export default function CountriesSocialPage() {
  const countries = enabledCountries();

  return (
    <main className="ru-force-light min-h-dvh bg-[#F7F5F0] text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-5 pb-10 pt-8">
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.22em] text-[#1A4D3A] uppercase">
            {BRAND.appName}
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-[2.75rem] leading-[1.05] font-bold tracking-tight text-[#1A4D3A]">
            {GLOBAL_COUNTRY_COUNT} countries
          </h1>
          <p className="mt-2 text-base text-slate-600">
            Rural logistics across {MARKET_REGIONS_LABEL}
          </p>
        </header>

        <div
          className="mt-8 grid grid-cols-5 gap-x-2 gap-y-4"
          aria-label={`${GLOBAL_COUNTRY_COUNT} country flags`}
        >
          {countries.map((c) => (
            <div
              key={c.code}
              className="flex flex-col items-center gap-1"
              title={c.name}
            >
              <span className="text-[2rem] leading-none" aria-hidden>
                {c.flag}
              </span>
              <span className="max-w-[4.5rem] truncate text-center text-[9px] font-medium text-slate-500">
                {c.name}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-semibold tracking-wide text-slate-800">
          Ride · Delivery · Farm · Courier
        </p>

        <div className="mt-5 rounded-2xl border border-[#1A4D3A]/15 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(26,77,58,0.08)]">
          <ul className="space-y-2.5 text-sm font-semibold text-[#1A4D3A]">
            <li>Keep 85% of every trip</li>
            <li>Cash &amp; Card accepted</li>
            <li>Work when you want</li>
            <li>Drivers wanted in every village</li>
          </ul>
        </div>

        <Link
          href="/driver/join"
          className="mt-8 flex w-full items-center justify-center rounded-2xl bg-[#1A4D3A] py-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          Apply to drive
        </Link>

        <p className="mt-4 text-center text-xs text-slate-500">
          village-ride.vercel.app/driver/join
        </p>

        <p className="mt-auto pt-8 text-center text-[10px] leading-relaxed text-slate-400">
          Screenshot this page for social posts · Not for US/UK city markets —
          built for villages
        </p>
      </div>
    </main>
  );
}
