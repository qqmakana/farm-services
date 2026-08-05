import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { FoundingDriverCard } from "@/components/marketing/founding-driver-card";
import {
  FOUNDING_APP_URL,
  FOUNDING_ERA_CUTOFF_ISO,
} from "@/lib/founding-driver";

export default function FoundingDriverMarketingPage() {
  const cutoff = new Date(FOUNDING_ERA_CUTOFF_ISO).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <SiteNav />
      <main className="ru-force-light min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Driver recruitment
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black">
            Founding Driver card
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Square creative for Instagram, Facebook &amp; WhatsApp. Founding Era
            ends {cutoff}. Share {FOUNDING_APP_URL}.
          </p>

          <div className="mt-6">
            <FoundingDriverCard />
          </div>

          <p className="mt-8 text-center text-sm text-slate-600">
            Drivers apply at{" "}
            <Link
              href="/driver/join"
              className="font-semibold text-black underline"
            >
              /driver/join
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
