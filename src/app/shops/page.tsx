import { SiteNav } from "@/components/site-nav";
import { BuyerShops } from "@/components/buyer-shops";
import { listProducts, listShops } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShopsBuyerPage() {
  const [shops, products] = await Promise.all([listShops(), listProducts()]);

  return (
    <>
      <SiteNav active="shops" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          Shop delivery
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Buy & deliver
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Order from a local shop. We assign a bakkie or truck from item size.
          Pay delivery by card.
        </p>
        <div className="ru-card mt-6 p-5 sm:p-6">
          <BuyerShops shops={shops} products={products} />
        </div>
      </main>
    </>
  );
}
