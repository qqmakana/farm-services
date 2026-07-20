import Link from "next/link";
import { ShareAppButton } from "@/components/share-app-button";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/", label: "Home", key: "home" },
  { href: "/ride", label: "Ride", key: "book" },
  { href: "/delivery", label: "Deliver", key: "delivery" },
  { href: "/farm", label: "Farm", key: "farm" },
  { href: "/shops", label: "Buy", key: "shops" },
  { href: "/driver", label: "Drive", key: "driver" },
  { href: "/partners", label: "Partners", key: "partners" },
  { href: "/shop", label: "Sell", key: "shop" },
  { href: "/dispatch", label: "Ops", key: "dispatch" },
] as const;

export function SiteNav({
  active,
}: {
  active?: (typeof links)[number]["key"];
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--ru-brand)]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" width={32} height={32} className="h-8 w-8" />
          </span>
          <span className="leading-tight">
            <span className="block font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
              {BRAND.appName}
            </span>
            <span className="block text-[10px] font-medium tracking-wide text-white/70 uppercase">
              {BRAND.company}
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-0.5 text-sm">
          {links.map((link) => {
            const isActive = active === link.key;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 transition sm:px-3 ${
                  isActive
                    ? "bg-white text-[var(--ru-brand)]"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <ShareAppButton className="ml-1" />
        </nav>
      </div>
    </header>
  );
}
