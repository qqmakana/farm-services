import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { StatusHealth } from "@/components/ops/status-health";
import { BRAND, BRAND_WHATSAPP_HREF } from "@/lib/brand";
import { WhatsAppLinks } from "@/lib/whatsapp-links";

export const metadata = {
  title: `Status — ${BRAND.appName}`,
  description: "Village Ride uptime. If we are down, we say so here.",
};

export default function StatusPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-[#F5F5F5] px-4 py-10 pb-20">
        <p className="text-[13px] font-semibold text-[#666666]">Ops</p>
        <h1 className="mt-1 text-[28px] font-bold text-[#111111]">
          Service status
        </h1>
        <div className="mt-6 rounded-[16px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <p className="text-[16px] font-bold text-[#06c167]">
            Systems operating
          </p>
          <StatusHealth />
          <p className="mt-2 text-[14px] text-[#666666]">
            If the app fails, WhatsApp {BRAND.phone}. We send a broadcast:
            “App is down, we&apos;re fixing it.”
          </p>
        </div>
        <div className="mt-4 rounded-[16px] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
          <p className="text-[15px] font-bold text-[#111111]">Launch hosting</p>
          <p className="mt-2 text-[14px] leading-relaxed text-[#666666]">
            Vercel Hobby and Supabase Free. We stay on these on purpose — no
            Pro upgrade for launch.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[13px] text-[#666666]">
            <li>
              Hobby: about 1 million function calls per month. A huge TikTok
              spike can pause the site until next month.
            </li>
            <li>
              Supabase Free can pause after a quiet week. Restore in the
              dashboard, then tell riders on WhatsApp.
            </li>
            <li>
              Driver matching uses GitHub Actions every 5 minutes (Hobby cannot
              run Vercel Cron that often).
            </li>
          </ul>
        </div>
        <a
          href={WhatsAppLinks.downtime()}
          className="uber-press uber-btn-outline mt-6 inline-flex no-underline"
        >
          Tell us it&apos;s down
        </a>
        <p className="mt-8 text-[13px] text-[#666666]">
          Cards: Yoco. Watch the Vercel and Supabase dashboards if bookings
          suddenly fail.
        </p>
        <p className="mt-4 text-[14px]">
          <Link href="/legal" className="font-semibold text-[#111111]">
            Legal →
          </Link>
          {" · "}
          <a href={BRAND_WHATSAPP_HREF} className="font-semibold text-[#111111]">
            WhatsApp
          </a>
        </p>
      </main>
    </>
  );
}
