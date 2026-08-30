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
        <main className="ru-page max-w-lg text-center">
          <h1 className="ru-page-title">Shop owner sign-in</h1>
          <p className="ru-page-sub">
            This is the kitchen — menu photos, incoming orders, mark Ready.
            Sign in with the email you used when you registered the shop.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login?next=/merchant/dashboard"
              className="ru-btn ru-btn-primary !inline-flex"
            >
              Sign in
            </Link>
            <Link
              href="/merchant/register"
              className="ru-btn ru-btn-secondary !inline-flex"
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
        <main className="ru-page max-w-lg text-center">
          <h1 className="ru-page-title">This is a rider account</h1>
          <p className="ru-page-sub">
            You are signed in as <strong className="text-black">{data.role}</strong>.
            Shop kitchen needs a shop-owner login. Register the shop, or sign
            out and use the business email.
          </p>
          <Link
            href="/merchant/register"
            className="ru-btn ru-btn-primary mt-6 !inline-flex"
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
