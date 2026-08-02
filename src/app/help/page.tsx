import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ContactSupportActions } from "@/components/support/contact-support";
import { BRAND, BRAND_TEL_HREF, BRAND_WHATSAPP_HREF } from "@/lib/brand";

export const metadata = {
  title: `Help & FAQ — ${BRAND.appName}`,
  description:
    "Contact Village Ride support on WhatsApp or email. Common questions about partners, drivers, payments, and tracking.",
};

const FAQS = [
  {
    q: "How do I add a location without a map or GPS?",
    a: "Search for the place. If it’s missing, tap “Add missing location”. Enter a name (e.g. Sipho’s Farm), a description drivers will recognise (e.g. Next to the blue water tank), and the village. Pinning the map is optional — skip it if you have no signal. Everyone can then find that landmark when booking.",
  },
  {
    q: "Does Village Ride require GPS or a street address?",
    a: "Use both: tap the map (or GPS) to pin, and always describe a landmark (“green gate, next to the mango tree”). The map does not replace the landmark — drivers use both. Landmark text alone still works if GPS is weak. Saved Home/Work places also work offline from your phone cache.",
  },
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
    a: "You’ll see a notice on the order. Keep the order open while we search, or schedule a delivery for later when more drivers are available. Or WhatsApp support and we’ll help dispatch.",
  },
  {
    q: "How does my customer track the delivery?",
    a: "From your dashboard, tap Share trip link and send them /trip/[code]. No customer account needed.",
  },
  {
    q: "How do referrals work?",
    a: "Riders: open Account → share your VR code — get R50 when a friend completes their first ride. Shops: share /shop?ref=YOURCODE for partner referrals (R50).",
  },
  {
    q: "Are drivers verified?",
    a: "Yes. Drivers submit ID and vehicle photos and must be approved before going online. You can see name, photos, and star rating on assigned orders.",
  },
  {
    q: "Need human support?",
    a: `WhatsApp ${BRAND.phone} or email ${BRAND.email}. We reply as soon as we can.`,
  },
];

export default function HelpPage() {
  return (
    <>
      <SiteNav active="help" />
      <main className="ru-force-light mx-auto min-h-dvh max-w-2xl bg-white px-4 py-10 pb-20">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Support
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold text-slate-900">
          Help &amp; Support
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Chat on WhatsApp or email us — both go to the Sandton Streets team.
        </p>

        <section className="mt-6 rounded-2xl border border-slate-100 bg-[#fafafa] p-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Contact us
          </p>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>
              WhatsApp:{" "}
              <a
                href={BRAND_WHATSAPP_HREF}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-black underline"
              >
                {BRAND.phone}
              </a>
            </li>
            <li>
              Email:{" "}
              <a
                href={`mailto:${BRAND.email}`}
                className="font-semibold text-black underline"
              >
                {BRAND.email}
              </a>
            </li>
          </ul>
          <ContactSupportActions className="mt-4" />
          <a
            href={BRAND_TEL_HREF}
            className="mt-2 block rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-semibold text-black"
          >
            Call {BRAND.phone}
          </a>
        </section>

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
          <Link
            href="/partners"
            className="font-semibold text-[#000000] underline"
          >
            For businesses
          </Link>
          {" · "}
          <Link
            href="/driver"
            className="font-semibold text-[#000000] underline"
          >
            Drive with us
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
