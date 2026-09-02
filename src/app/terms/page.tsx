import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND, BRAND_ADDRESS_LINE } from "@/lib/brand";

export const metadata = {
  title: `Terms of Service — ${BRAND.appName}`,
  description: `Terms for using ${BRAND.appName} rides, deliveries, and partner tools.`,
  robots: { index: true, follow: true },
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Agreement",
    body: [
      `By using ${BRAND.appName} (web or Android app), you agree to these terms. If you do not agree, do not use the service.`,
      `Operator: ${BRAND.company}, ${BRAND_ADDRESS_LINE}, ${BRAND.country}. Contact ${BRAND.email}.`,
    ],
  },
  {
    title: "The service",
    body: [
      `${BRAND.appName} is a technology platform, not a transport company and not a shop. Drivers and shop owners are independent contractors. If a driver crashes, they (and their insurer) are responsible except where South African law says we cannot exclude liability.`,
    ],
  },
  {
    title: "Accounts",
    body: [
      "You must provide accurate information. Keep your login and phone number secure.",
      "Drivers must complete verification and follow the Driver Code of Conduct before going online. We may suspend accounts for safety, fraud, or policy breaches.",
    ],
  },
  {
    title: "Bookings and payments",
    body: [
      "Quotes and ETAs are estimates. Actual time and availability depend on drivers and conditions.",
      "Pay cash to the driver or card via Yoco. Card refunds are processed in the Yoco dashboard (2–7 days on the bank statement).",
      "Cancel within 2 minutes: full refund. After 2 minutes with a driver assigned: R 15 goes to the driver. Village Pass: free cancel before the trip starts. Full policy: /legal/cancellations.",
      "Drivers pay platform commission from their prepaid wallet when a trip completes (about 10% unless stated otherwise).",
      "Partners are responsible for accurate order details and legal sale of goods they ship. First 30 days: 0% commission on shop goods.",
    ],
  },
  {
    title: "Safety and prohibited use",
    body: [
      "Do not use the app for illegal goods, harassment, fraud, or anything that endangers people.",
      "Drivers must hold valid licences and roadworthy vehicles where required by law.",
      "We may refuse or cancel bookings that look unsafe or abusive.",
    ],
  },
  {
    title: "Liability",
    body: [
      "The service is provided “as is.” To the fullest extent allowed by South African law, we are not liable for indirect losses, missed appointments, or disputes solely between customers and drivers/partners.",
      "Nothing in these terms limits rights you have that cannot be waived under applicable consumer law.",
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update these terms. Continued use after changes means you accept the updated terms. The “Last updated” date will change when we revise them.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-white px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Legal
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Last updated: 31 August 2026
        </p>
        <div className="mt-8 space-y-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-600">
                {section.body.map((line) => (
                  <li key={line.slice(0, 48)}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/legal" className="font-semibold text-[#000000] underline">
            All policies
          </Link>
          {" · "}
          <Link href="/legal/cancellations" className="font-semibold text-[#000000] underline">
            Cancellations
          </Link>
          {" · "}
          <Link href="/privacy" className="font-semibold text-[#000000] underline">
            Privacy
          </Link>
          {" · "}
          <Link href="/help" className="font-semibold text-[#000000] underline">
            Help
          </Link>
        </p>
      </main>
    </>
  );
}
