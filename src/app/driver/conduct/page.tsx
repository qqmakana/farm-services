import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";
import { DRIVER_CONDUCT_RULES } from "@/lib/trust";

export const metadata = {
  title: "Driver Code of Conduct",
};

export default function DriverConductPage() {
  return (
    <>
      <SiteNav active="driver" />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          {BRAND.appName}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-[#1A4D3A]">
          Driver Code of Conduct
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Every driver must agree to these rules before going online. Breaking
          them can lead to suspension.
        </p>
        <ol className="mt-8 list-decimal space-y-3 pl-5 text-sm text-slate-800">
          {DRIVER_CONDUCT_RULES.map((rule) => (
            <li key={rule} className="leading-relaxed">
              {rule}
            </li>
          ))}
        </ol>
        <p className="mt-8 text-sm text-slate-500">
          Questions? Call or WhatsApp {BRAND.phone}.
        </p>
        <Link
          href="/driver"
          className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white"
        >
          Back to driver apply
        </Link>
      </main>
    </>
  );
}
