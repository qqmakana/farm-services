import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { PamphletCard } from "@/components/marketing/pamphlet-card";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Handout — ${BRAND.appName}`,
  description: `Scan to open ${BRAND.appName}. Riders and drivers welcome.`,
};

export default function PamphletMarketingPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Screenshot this
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black">
            Handout
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Take a screenshot and send it to whoever is handing these out. The
            square is for everyone — people who need a ride, and people who
            drive.
          </p>

          <div className="mt-6">
            <PamphletCard />
          </div>
        </div>
      </main>
    </>
  );
}
