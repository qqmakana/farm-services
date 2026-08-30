import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Pricing — ${BRAND.appName}`,
  description: "Free merchant signup. Drivers keep 90%. Clear Village Ride fees.",
};

export default function PricingPage() {
  return (
    <>
      <SiteNav active="pricing" />
      <main className="mx-auto max-w-3xl px-4 py-10 pb-20">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
          Simple pricing
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Rider pays a simple fare. Driver keeps 90%. Village Ride keeps 10%.
          Cash or card.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
            <h2 className="text-lg font-bold">For merchants</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>✓ FREE signup</li>
              <li>✓ 0% commission on your goods</li>
              <li>✓ No monthly fees</li>
              <li>✓ Pay only the delivery fee (customer → driver)</li>
            </ul>
            <Link
              href="/merchant/register"
              className="mt-4 inline-block rounded-xl bg-[#000000] px-4 py-2 text-sm font-bold text-white"
            >
              Sign up free
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">For drivers</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>✓ Keep ~90% of every trip</li>
              <li>✓ ~10% platform fee (wallet)</li>
              <li>✓ Weekly wallet top-ups / reconciliation</li>
              <li>✓ Go online when you want</li>
            </ul>
            <Link
              href="/driver/join"
              className="mt-4 inline-block rounded-xl border border-[#000000] px-4 py-2 text-sm font-bold text-[#000000]"
            >
              Apply to drive
            </Link>
          </div>
        </div>

        <section className="mt-10 rounded-xl border bg-slate-50 p-5">
          <h2 className="font-bold">What the rider pays</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Under 2 km: <strong>R15</strong> flat</li>
            <li>Over 2 km: <strong>R15 + R5/km</strong> after the first 2 km</li>
            <li>Cash or card (PayPal)</li>
          </ul>
          <h2 className="mt-6 font-bold">Who gets what</h2>
          <p className="mt-2 text-sm text-slate-700">
            Example: <strong>R50</strong> trip → driver gets{" "}
            <strong>R45</strong>, {BRAND.appName} keeps <strong>R5</strong>.
            Founding drivers (first trip by 30 Aug) also share a 2% city
            revenue pool at month-end. Card payouts settle weekly.
          </p>
        </section>

        <section className="mt-10 overflow-x-auto">
          <h2 className="font-bold">How we compare</h2>
          <table className="mt-3 w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-2 pr-3">Feature</th>
                <th className="py-2 pr-3">{BRAND.appName}</th>
                <th className="py-2 pr-3">Uber</th>
                <th className="py-2">Bolt</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              <tr className="border-b">
                <td className="py-2 pr-3">Village / rural focus</td>
                <td className="py-2 pr-3 font-semibold text-emerald-800">Yes</td>
                <td className="py-2 pr-3">Limited</td>
                <td className="py-2">Limited</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">Merchant self-serve</td>
                <td className="py-2 pr-3 font-semibold text-emerald-800">Free</td>
                <td className="py-2 pr-3">N/A</td>
                <td className="py-2">N/A</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-3">Cash payments</td>
                <td className="py-2 pr-3 font-semibold text-emerald-800">Yes</td>
                <td className="py-2 pr-3">Varies</td>
                <td className="py-2">Varies</td>
              </tr>
              <tr>
                <td className="py-2 pr-3">Driver keep rate</td>
                <td className="py-2 pr-3 font-semibold text-emerald-800">~90%</td>
                <td className="py-2 pr-3">Lower</td>
                <td className="py-2">Lower</td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
