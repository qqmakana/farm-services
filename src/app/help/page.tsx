import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
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
    q: "Who pays the 10% commission?",
    a: "The rider pays the fare (cash or card). The driver keeps 90%. Village Ride keeps 10% — on cash trips that 10% comes from the driver’s prepaid wallet when the trip completes, not as a shop invoice. Founding drivers also share a 2% city revenue pool at month-end.",
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
      <main className="mx-auto min-h-dvh max-w-md bg-white px-4 pt-6 pb-16">
        <Link
          href="/account"
          className="uber-press inline-flex rounded-full bg-gray-100 px-3 py-2 text-sm font-semibold text-black hover:bg-gray-200"
        >
          ← Account
        </Link>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-black">
          Help
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Chat on WhatsApp or email — we reply as soon as we can.
        </p>

        <section className="mt-6 rounded-2xl bg-gray-50 p-4">
          <p className="text-sm font-bold text-black">Contact us</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
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
            className="uber-press uber-btn-soft mt-2 flex w-full"
          >
            Call {BRAND.phone}
          </a>
        </section>

        <ul className="mt-8 divide-y divide-gray-100">
          {FAQS.map((item) => (
            <li key={item.q} className="py-4">
              <h2 className="font-bold text-black">{item.q}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                {item.a}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
