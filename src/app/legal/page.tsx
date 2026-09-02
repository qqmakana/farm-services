import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";
import { CANCEL_POLICY_LINE } from "@/lib/ops-policy";

export const metadata = {
  title: `Legal — ${BRAND.appName}`,
  description: `Terms, privacy, cancellations, and POPIA notices for ${BRAND.appName}.`,
};

const LINKS = [
  {
    href: "/terms",
    title: "Terms of Service",
    body: "Village Ride is a platform. Drivers are independent contractors.",
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
    body: "How we use phones, GPS, ID photos, and payments under POPIA.",
  },
  {
    href: "/legal/cancellations",
    title: "Cancellations & refunds",
    body: CANCEL_POLICY_LINE,
  },
  {
    href: "/status",
    title: "Service status",
    body: "If the app is down, we post here and on WhatsApp.",
  },
  {
    href: "/legal/kitchen",
    title: "Shop fridge card",
    body: "Print the 5 kitchen steps. Stick it on the fridge.",
  },
] as const;

export default function LegalHubPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-[#F5F5F5] px-4 py-10 pb-20">
        <p className="text-[13px] font-semibold text-[#666666]">Legal</p>
        <h1 className="mt-1 text-[28px] font-bold text-[#111111]">
          Policies
        </h1>
        <p className="mt-2 text-[15px] text-[#666666]">
          {BRAND.company}, South Africa. Questions: {BRAND.email}.
        </p>
        <ul className="mt-6 space-y-4">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="uber-press block rounded-[16px] bg-white p-4 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <p className="font-bold text-[#111111]">{item.title} →</p>
                <p className="mt-1 text-[14px] text-[#666666]">{item.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
