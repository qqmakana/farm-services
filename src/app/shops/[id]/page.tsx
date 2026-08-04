import Link from "next/link";
import { BookingTabChrome } from "@/components/customer/booking-tab-chrome";
import { ShopMenu } from "@/components/shops/shop-menu";
import { listProducts } from "@/lib/actions";
import { getShopById } from "@/lib/actions-shop-orders";

export const dynamic = "force-dynamic";

export default async function ShopMenuPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shop = await getShopById(id);

  if (!shop || !shop.is_active) {
    return (
      <BookingTabChrome>
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Shop not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This shop is closed or unavailable.
          </p>
          <Link
            href="/shops"
            className="mt-6 inline-block rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white"
          >
            Back to shops
          </Link>
        </main>
      </BookingTabChrome>
    );
  }

  const products = await listProducts(shop.id);

  return (
    <BookingTabChrome>
      <ShopMenu shop={shop} products={products} />
    </BookingTabChrome>
  );
}
