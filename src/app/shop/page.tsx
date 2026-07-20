import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ShopPortal } from "@/components/shop-portal";
import { listJobs, listProducts, listShops } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const [shops, products, jobs] = await Promise.all([
    listShops(),
    listProducts(),
    listJobs(),
  ]);

  return (
    <>
      <SiteNav active="shop" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          Seller
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Shop or farm
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Register as a <strong>Farm</strong> (farmer) or a town shop. List
          products. When buyers order, delivery jobs go to bakkie/truck drivers.{" "}
          <Link href="/partners" className="font-semibold text-[#1A4D3A] underline">
            Why partner with Village Ride?
          </Link>
        </p>
        <div className="mt-6">
          <ShopPortal shops={shops} products={products} jobs={jobs} />
        </div>
      </main>
    </>
  );
}
