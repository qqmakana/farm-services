import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ShopPortal } from "@/components/shop-portal";
import { listJobs, listProducts, listShops } from "@/lib/actions";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Sell on ${BRAND.appName}`,
  description: "Register your shop or farm and deliver with Village Ride.",
};

export default async function ShopRegisterPage() {
  const [shops, products, jobs] = await Promise.all([
    listShops(),
    listProducts(),
    listJobs(),
  ]);

  return (
    <>
      <SiteNav active="shop" />
      <main className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] text-[var(--ru-ink)]">
        <div className="mx-auto max-w-lg px-4 py-10 pb-24">
          <p className="ru-section-label">Partners</p>
          <h1 className="ru-page-title mt-2">Sell on Village Ride</h1>
          <p className="ru-page-sub">
            Register your shop or farm. List products. When buyers order,
            delivery jobs go to bakkie and truck drivers.
          </p>
          <p className="mt-3 text-sm text-[var(--ru-muted)]">
            Prefer the full guide?{" "}
            <Link href="/partners" className="font-semibold text-black underline">
              Why partner with us
            </Link>
          </p>
          <div className="ru-card mt-8 p-5">
            <ShopPortal shops={shops} products={products} jobs={jobs} />
          </div>
        </div>
      </main>
    </>
  );
}
