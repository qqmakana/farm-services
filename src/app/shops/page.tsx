import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { UBER_PAGE } from "@/components/customer/uber-chrome";
import { ShopStorefront } from "@/components/shops/shop-storefront";
import { ServicePills } from "@/components/uber/service-pills";
import { listShops } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function ShopsBuyerPage() {
  let shops: Awaited<ReturnType<typeof listShops>> = [];
  try {
    shops = await listShops();
  } catch {
    shops = [];
  }

  return (
    <BookingTabChrome>
      <main className={UBER_PAGE}>
        <ServicePills className="mb-5" />
        <ShopStorefront shops={shops} />
      </main>
    </BookingTabChrome>
  );
}
