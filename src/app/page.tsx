import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND, BRAND_ADDRESS_LINE, BRAND_TEL_HREF, BRAND_WHATSAPP_HREF } from "@/lib/brand";

const roles = [
  {
    href: "/book?service=ride",
    who: "Passenger",
    title: "I need a ride",
    body: "Village ↔ town. Car only. PayPal → driver auto-matched.",
  },
  {
    href: "/book?service=delivery",
    who: "Sender",
    title: "I need to move goods",
    body: "Fridge, TV, furniture. Bakkie or truck.",
  },
  {
    href: "/farm",
    who: "Customer / farm buyer",
    title: "I want farm products",
    body: "Eggs, chickens, fertilizer. Farm Connect → bakkie.",
  },
  {
    href: "/shops",
    who: "Shop buyer",
    title: "I buy from a shop",
    body: "Order from a store; we deliver with bakkie/truck.",
  },
  {
    href: "/shop",
    who: "Shop or farmer (seller)",
    title: "I sell (shop or farm)",
    body: "Register as Shop or Farm, list products, get delivery jobs.",
  },
  {
    href: "/driver",
    who: "Driver / car or bakkie owner",
    title: "I drive",
    body: "SA number → auto-approved → go online → earn.",
  },
  {
    href: "/dispatch",
    who: "You (owner / ops)",
    title: "Operations",
    body: "Jobs ledger, WhatsApp drivers, rare hire overrides.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteNav active="home" />
      <main>
        <section className="relative overflow-hidden bg-[var(--ru-brand)] text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, #2d6a4f 0%, transparent 45%), radial-gradient(circle at 80% 0%, #0ea5e9 0%, transparent 35%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <p className="text-sm font-semibold tracking-[0.18em] text-white/70 uppercase">
              {BRAND.company}
            </p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-5xl font-extrabold tracking-tight sm:text-6xl">
              {BRAND.appName}
            </p>
            <h1 className="mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">
              Request a ride anytime — village to village. Cars, bakkies and
              farm delivery for small towns across South Africa.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70">
              Drivers and shops use the same app. SA drivers are auto-approved.
              Pay → match → track live.
            </p>
            <p className="mt-6 max-w-xl text-sm text-white/65">
              {BRAND_ADDRESS_LINE}
              <br />
              <a className="underline hover:text-white" href={BRAND_TEL_HREF}>
                {BRAND.phone}
              </a>
              {" · "}
              <a
                className="underline hover:text-white"
                href={BRAND_WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
              {" · "}
              <a className="underline hover:text-white" href={`mailto:${BRAND.email}`}>
                {BRAND.email}
              </a>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Who are you?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            This is how the app knows farmer vs shop vs passenger — you choose
            the door.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((role) => (
              <Link
                key={role.href}
                href={role.href}
                className="ru-card block p-5 transition hover:border-[var(--ru-brand)]/40 hover:shadow-md"
              >
                <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                  {role.who}
                </p>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {role.body}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
