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
        <main className="mx-auto max-w-md bg-[#f2f2f2] px-4 py-16 text-center font-[family-name:var(--font-display)]">
          <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#0a0a0a]">Shop not found</h1>
          <p className="mt-2 text-[15px] font-medium text-[#6b6b6b]">
            This shop is closed or unavailable.
          </p>
          <Link
            href="/shops"
            className="uber-press mt-6 inline-block rounded-[9999px] bg-[#0a0a0a] px-5 py-3 text-sm font-bold text-white"
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
