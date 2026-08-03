import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { BuyerShops } from "@/components/buyer-shops";
import { listProducts, listShops } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShopsBuyerPage() {
  const [shops, products] = await Promise.all([listShops(), listProducts()]);

  return (
    <BookingTabChrome>
      <main className="mx-auto min-h-dvh max-w-md bg-white px-4 py-8 pb-28">
        <p className="text-xs font-semibold tracking-[0.16em] text-gray-500 uppercase">
          Shop delivery
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Buy & deliver
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Order from a local shop. We assign a bakkie or truck from item size.
          Pay cash or card — same checkout as Ride &amp; Delivery.
        </p>
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-lg ring-1 ring-gray-100">
          <BuyerShops shops={shops} products={products} />
        </div>
      </main>
    </BookingTabChrome>
  );
}
