import { ShopListSkeleton } from "@/components/ui/skeleton";
import { UBER_H1, UBER_PAGE } from "@/components/customer/uber-chrome";

export default function ShopsLoading() {
  return (
    <main className={UBER_PAGE}>
      <h1 className={UBER_H1}>Shops</h1>
      <ShopListSkeleton />
    </main>
  );
}
