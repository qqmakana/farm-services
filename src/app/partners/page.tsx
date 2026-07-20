import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `For Businesses — ${BRAND.appName}`,
  description:
    "Self-serve partner deliveries for shops and farms. Free signup, driver push notifications, automatic commission, weekly reports.",
};

export default function PartnersPage() {
  return (
    <>
      <SiteNav active="partners" />
      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0f3328_0%,#1A4D3A_45%,#2d6b52_100%)] text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15), transparent 45%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.08), transparent 40%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 py-16 sm:py-24">
            <p className="text-xs font-semibold tracking-[0.2em] text-white/70 uppercase">
              {BRAND.appName} Partners
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight sm:text-5xl">
              Deliveries for your shop — no meetings, no WhatsApp chaos
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
              Sign up online, create deliveries from your dashboard, and local
              bakkie drivers get push notifications. Commission is automatic.
              Weekly reports land in your inbox.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#1A4D3A] transition active:scale-95"
              >
                Sign up free
              </Link>
              <Link
                href="/login?next=/merchant/dashboard"
                className="rounded-xl border border-white/40 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
              >
                Partner login
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
          <ol className="mt-6 space-y-5">
            {[
              {
                n: "1",
                t: "Register your business",
                d: "Email + password on /shop. You get a merchant login and a unique referral code.",
              },
              {
                n: "2",
                t: "Create a delivery",
                d: "Pickup is your shop. Enter customer drop-off — deliver now or schedule for later.",
              },
              {
                n: "3",
                t: "Drivers get notified",
                d: "Online verified drivers receive an FCM push and can accept in the app.",
              },
              {
                n: "4",
                t: "Track & share",
                d: "Share a live trip link with your customer. Rate after delivery.",
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1A4D3A] text-sm font-bold text-white">
                  {step.n}
                </span>
                <div>
                  <p className="font-bold text-slate-900">{step.t}</p>
                  <p className="mt-1 text-sm text-slate-600">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-slate-100 bg-slate-50">
          <div className="mx-auto max-w-3xl px-4 py-12">
            <h2 className="text-2xl font-bold text-slate-900">Pricing</h2>
            <p className="mt-3 text-sm text-slate-600">
              <strong>Free signup.</strong> Customers pay the driver the delivery
              fee. Village Ride takes ~15% platform commission from the{" "}
              <strong>driver wallet</strong> — not a separate invoice to your
              shop. No paid WhatsApp Business API required.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Verified drivers",
                "Push + in-app alerts",
                "Weekly auto reports",
              ].map((badge) => (
                <li
                  key={badge}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-[#1A4D3A]"
                >
                  {badge}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-12 pb-20 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Ready to go self-serve?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Grow with referrals — invite other shops with your code.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-6 py-3 text-sm font-bold text-white transition active:scale-95"
          >
            Create partner account
          </Link>
        </section>
      </main>
    </>
  );
}
