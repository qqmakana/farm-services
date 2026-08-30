import Link from "next/link";
import {
  BRAND,
  BRAND_ADDRESS_LINE,
  BRAND_TEL_HREF,
  BRAND_WHATSAPP_HREF,
} from "@/lib/brand";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { href: "/onboarding", label: "About us" },
      { href: "/pricing", label: "Our offerings" },
      { href: "/countries", label: "Countries" },
      { href: "/driver/join", label: "Careers" },
      { href: "/help", label: "Help" },
    ],
  },
  {
    title: "Products",
    links: [
      { href: "/ride", label: "Ride" },
      { href: "/driver/join", label: "Drive" },
      { href: "/delivery", label: "Deliver" },
      { href: "/farm", label: "Farm" },
      { href: "/courier", label: "Courier" },
      { href: "/shops", label: "Shops" },
      { href: "/merchant/dashboard", label: "Shop owner kitchen" },
      { href: "/merchant/register", label: "Register a shop" },
    ],
  },
  {
    title: "Global citizenship",
    links: [
      { href: "/help", label: "Safety" },
      { href: "/terms", label: "Legal" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
  {
    title: "Travel",
    links: [
      { href: "/ride?when=later", label: "Reserve" },
      { href: "/countries", label: "Cities" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link
          href="/help"
          className="inline-block text-sm font-medium text-white hover:underline"
        >
          Visit Help Center
        </Link>

        <div className="mt-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-bold text-white">{col.title}</h2>
              <ul className="mt-3 space-y-2">
                {col.links.map((item) => (
                  <li key={`${col.title}-${item.label}`}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-white/80 hover:text-white hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 text-xs text-white/55">
          <p className="font-semibold text-white/80">
            {BRAND.appName} by {BRAND.company}
          </p>
          <p className="mt-1">{BRAND_ADDRESS_LINE}</p>
          <p className="mt-1">
            <a href={BRAND_TEL_HREF} className="hover:text-white hover:underline">
              {BRAND.phone}
            </a>
            {" · "}
            <a
              href={BRAND_WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white hover:underline"
            >
              WhatsApp
            </a>
            {" · "}
            <a
              href={`mailto:${BRAND.email}`}
              className="hover:text-white hover:underline"
            >
              {BRAND.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
