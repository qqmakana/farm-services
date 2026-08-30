import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ShopPortal } from "@/components/shop-portal";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Register your shop — ${BRAND.appName}`,
  description: "Register your shop, add menu photos, and go live on Village Ride.",
};

export default function ShopRegisterPage() {
  return (
    <>
      <SiteNav active="shop" />
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="ru-section-label">Shop owner</p>
          <h1 className="ru-page-title mt-2">Register your shop</h1>
          <p className="ru-page-sub">
            Create the kitchen login. Then add name, price, and a photo of each
            plate. Riders see it on Shops. You keep 85% of goods. Delivery is
            separate.
          </p>
          <p className="mt-3 text-sm text-[var(--ru-muted)]">
            Already listed?{" "}
            <Link
              href="/login?next=/merchant/dashboard"
              className="font-semibold text-black underline"
            >
              Open kitchen
            </Link>
          </p>
          <div className="mt-8">
            <ShopPortal />
          </div>
        </div>
      </main>
    </>
  );
}
