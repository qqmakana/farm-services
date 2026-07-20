import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { BRAND } from "@/lib/brand";

export const metadata = {
  title: `Help & FAQ — ${BRAND.appName}`,
  description: "Common questions about Village Ride partners, drivers, payments, and tracking.",
};

const FAQS = [
  {
    q: "How do I sign up as a business partner?",
    a: "Go to /partners or /shop, create an account with your business email, then open /merchant/dashboard. No in-person meeting required.",
  },
  {
    q: "Who pays the 15% commission?",
    a: "Customers pay the driver the delivery fee. Village Ride deducts ~15% from the driver’s prepaid wallet when the trip completes — not as a separate shop invoice.",
  },
  {
    q: "What if no drivers are online?",
    a: "You’ll see a notice on the order. Keep the order open while we search, or schedule a delivery for later when more drivers are available.",
  },
  {
    q: "How does my customer track the delivery?",
    a: "From your dashboard, tap Share trip link and send them /trip/[code]. No customer account needed.",
  },
  {
    q: "How do referrals work?",
    a: "Each shop gets a code (first 4 letters of your name + 3 random characters). Share /shop?ref=YOURCODE — when they sign up, it counts toward your weekly report.",
  },
  {
    q: "Are drivers verified?",
    a: "Yes. Drivers submit ID and vehicle photos and must be approved before going online. You can see name and star rating on assigned orders.",
  },
  {
    q: "Need human support?",
    a: `Email ${BRAND.email} or call ${BRAND.phone}. For urgent dispatch issues, use Ops if you have access.`,
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Support
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Help &amp; FAQ
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Quick answers for partners, drivers, and customers.
        </p>
        <ul className="mt-8 space-y-4">
          {FAQS.map((item) => (
            <li
              key={item.q}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <h2 className="font-bold text-slate-900">{item.q}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.a}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm">
          <Link href="/partners" className="font-semibold text-[#1A4D3A] underline">
            For businesses
          </Link>
          {" · "}
          <Link href="/driver" className="font-semibold text-[#1A4D3A] underline">
            Drive with us
          </Link>
        </p>
      </main>
    </>
  );
}
