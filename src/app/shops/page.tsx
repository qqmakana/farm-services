import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { ShopStorefront } from "@/components/shops/shop-storefront";
import { ServicePills } from "@/components/uber/service-pills";
import { listShops } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShopsBuyerPage() {
  const shops = await listShops();

  return (
    <BookingTabChrome>
      <main className="mx-auto min-h-dvh max-w-md bg-white px-4 py-6 pb-28">
        <ServicePills className="mb-5" />
        <ShopStorefront shops={shops} />
      </main>
    </BookingTabChrome>
  );
}
