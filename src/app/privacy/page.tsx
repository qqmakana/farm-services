import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND, BRAND_ADDRESS_LINE } from "@/lib/brand";

export const metadata = {
  title: `Privacy Policy — ${BRAND.appName}`,
  description: `How ${BRAND.appName} collects, uses, and protects your information.`,
  robots: { index: true, follow: true },
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Who we are",
    body: [
      `${BRAND.appName} is operated by ${BRAND.company} (${BRAND_ADDRESS_LINE}, ${BRAND.country}).`,
      `Contact: ${BRAND.email} · ${BRAND.phone}.`,
    ],
  },
  {
    title: "Information we collect",
    body: [
      "Account details: name, phone number, email, and role (customer, driver, or partner).",
      "Booking details: pickup and drop-off landmarks, service type, payment preference, and trip status.",
      "Location: approximate or precise location when you allow it, to match rides, show nearby jobs, or improve maps. Landmark text works without GPS.",
      "Driver verification: ID and vehicle photos submitted for safety checks before going online.",
      "Device data: app/browser type, push notification tokens (FCM), and basic diagnostics to keep the service reliable.",
      "Payments: cash is settled between customer and driver. Card or wallet top-ups are processed by our payment providers; we do not store full card numbers.",
    ],
  },
  {
    title: "How we use information",
    body: [
      "Provide rides, deliveries, Farm Connect, and courier bookings.",
      "Match customers with nearby drivers and show trip tracking links.",
      "Verify drivers, prevent fraud, and enforce our driver code of conduct.",
      "Calculate commission from driver wallets when trips complete.",
      "Send operational messages (WhatsApp, email, or push) about bookings and account status.",
      "Improve reliability, safety, and support.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "Drivers see the booking details needed to complete a trip (landmarks, contact info when required).",
      "Partners see orders and trip links related to their shop.",
      "Service providers help us run the app (hosting, database, maps, push notifications, payments). They process data only to provide those services.",
      "We may disclose information if required by law or to protect users’ safety.",
      "We do not sell your personal information.",
    ],
  },
  {
    title: "Retention",
    body: [
      "We keep account and trip records for as long as needed to operate the service, meet legal obligations, resolve disputes, and prevent abuse. You can ask us to delete or correct your data where the law allows.",
    ],
  },
  {
    title: "Your choices",
    body: [
      "You can update account details in the app, turn off location or notifications in device settings, and contact us to access, correct, or delete personal data.",
      "Uninstalling the Android app stops local use; ask us if you also want your account removed from our systems.",
    ],
  },
  {
    title: "Children",
    body: [
      `${BRAND.appName} is not directed at children under 13. If you believe a child provided personal data, contact us and we will delete it.`,
    ],
  },
  {
    title: "Changes",
    body: [
      "We may update this policy as the product changes. The “Last updated” date below will change when we do. Continued use after an update means you accept the revised policy.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-white px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Legal
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Last updated: 30 July 2026
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
          <Link href="/help" className="font-semibold text-[#000000] underline">
            Help
          </Link>
          {" · "}
          <Link href="/terms" className="font-semibold text-[#000000] underline">
            Terms
          </Link>
        </p>
      </main>
    </>
  );
}
