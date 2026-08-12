import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { PamphletCard } from "@/components/marketing/pamphlet-card";
import { BRAND } from "@/lib/brand";
import { getAppInstallUrl, getPamphletEntryUrl } from "@/lib/app-links";

export const metadata: Metadata = {
  title: `Pamphlet QR — ${BRAND.appName}`,
  description: `Printable QR pamphlet — scan to install ${BRAND.appName} on your phone.`,
};

export default function PamphletMarketingPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light min-h-dvh bg-white text-slate-900 print:bg-white">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24 print:max-w-none print:py-4 print:pb-0">
          <div className="print:hidden">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Print &amp; distribute
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-black">
              Pamphlet QR code
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Scanning opens the install page — one tap to add Village Ride to
              the home screen. Download PNG for your print shop or print from
              this page.
            </p>
          </div>

          <div className="mt-6 print:mt-0">
            <PamphletCard />
          </div>

          <section className="mt-8 space-y-3 text-sm text-slate-600 print:hidden">
            <p>
              <strong className="text-slate-900">QR link:</strong>{" "}
              <a
                href={getPamphletEntryUrl()}
                className="font-medium text-black underline"
              >
                {getPamphletEntryUrl()}
              </a>
            </p>
            <p>
              <strong className="text-slate-900">Raw QR image:</strong>{" "}
              <a
                href={`/api/qr?size=512`}
                className="font-medium text-black underline"
              >
                /api/qr
              </a>{" "}
              (PNG, 512px)
            </p>
            <p>
              Drivers can also use{" "}
              <Link href="/driver/join" className="font-semibold text-black underline">
                /driver/join
              </Link>
              {" "}
              — rider pamphlets should use{" "}
              <Link href="/get-app" className="font-semibold text-black underline">
                {getAppInstallUrl()}
              </Link>
              .
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
