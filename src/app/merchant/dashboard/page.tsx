import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { MerchantDashboard } from "@/components/merchant/merchant-dashboard";
import { getMerchantDashboardData } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const data = await getMerchantDashboardData();

  if (!data) {
    return (
      <>
        <SiteNav active="shop" compact />
        <main className="ru-force-light ru-page max-w-lg bg-white text-center text-[#111111]">
          <h1 className="text-[28px] font-bold tracking-tight text-[#111111]">
            Shop owner sign-in
          </h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            This is the kitchen — menu photos, incoming orders, mark Ready.
            Sign in with the email you used when you registered the shop.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?next=/merchant/dashboard"
              className="uber-press inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 text-[16px] font-bold text-white"
            >
              Sign in
            </Link>
            <Link
              href="/merchant/register"
              className="uber-press inline-flex min-h-12 items-center justify-center rounded-full bg-[#06c167] px-6 text-[16px] font-bold text-white"
            >
              Register a shop
            </Link>
          </div>
        </main>
      </>
    );
  }

  if (
    data.role &&
    data.role !== "merchant" &&
    data.role !== "admin" &&
    data.role !== "dispatcher"
  ) {
    return (
      <>
        <SiteNav active="shop" compact />
        <main className="ru-force-light ru-page max-w-lg bg-white text-center text-[#111111]">
          <h1 className="text-[28px] font-bold tracking-tight text-[#111111]">
            This is a rider account
          </h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            You are signed in as <strong className="text-[#111111]">{data.role}</strong>.
            Shop kitchen needs a shop-owner login. Register the shop, or sign
            out and use the business email.
          </p>
          <Link
            href="/merchant/register"
            className="uber-press mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 text-[16px] font-bold text-white"
          >
            Register a shop
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav active="shop" compact />
      <MerchantDashboard
        shop={data.shop}
        jobs={data.jobs}
        email={data.email}
        notifications={data.notifications}
        reports={data.reports}
        referralCount={data.referralCount}
        shopOrders={data.shopOrders}
        products={data.products}
      />
    </>
  );
}
