import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Pricing — ${BRAND.appName}`,
  description: "Free merchant signup. Drivers keep 85%. Clear Village Ride fees.",
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
          No monthly fees. No WhatsApp Business API costs.
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
              href="/shop"
              className="mt-4 inline-block rounded-xl bg-[#1A4D3A] px-4 py-2 text-sm font-bold text-white"
            >
              Sign up free
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-bold">For drivers</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>✓ Keep ~85% of every trip</li>
              <li>✓ ~15% platform fee (wallet)</li>
              <li>✓ Weekly wallet top-ups / reconciliation</li>
              <li>✓ Go online when you want</li>
            </ul>
            <Link
              href="/driver/join"
              className="mt-4 inline-block rounded-xl border border-[#1A4D3A] px-4 py-2 text-sm font-bold text-[#1A4D3A]"
            >
              Apply to drive
            </Link>
          </div>
        </div>

        <section className="mt-10 rounded-xl border bg-slate-50 p-5">
          <h2 className="font-bold">Example</h2>
          <p className="mt-2 text-sm text-slate-700">
            Customer pays <strong>R300</strong> → Driver keeps{" "}
            <strong>R255</strong> → {BRAND.appName} keeps <strong>R45</strong>{" "}
            (15% from driver wallet).
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
                <td className="py-2 pr-3 font-semibold text-emerald-800">~85%</td>
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
