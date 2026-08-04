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
        <SiteNav active="shop" />
        <main className="ru-page max-w-lg text-center">
          <h1 className="ru-page-title">Merchant sign-in required</h1>
          <p className="ru-page-sub">
            Sign in with your business email to open the dashboard.
          </p>
          <Link
            href="/login?next=/merchant/dashboard"
            className="ru-btn ru-btn-primary mt-6 !inline-flex"
          >
            Sign in
          </Link>
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
        <SiteNav active="shop" />
        <main className="ru-page max-w-lg text-center">
          <h1 className="ru-page-title">Merchant access required</h1>
          <p className="ru-page-sub">
            This account is <strong className="text-black">{data.role}</strong>,
            not a merchant. Register a shop from the Sell page, or ask ops to set{" "}
            <code className="rounded bg-[var(--ru-elevated)] px-1">
              role=merchant
            </code>
            .
          </p>
          <Link
            href="/shop"
            className="ru-btn ru-btn-primary mt-6 !inline-flex"
          >
            Go to Sell / Register
          </Link>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteNav active="shop" />
      <MerchantDashboard
        shop={data.shop}
        jobs={data.jobs}
        email={data.email}
        notifications={data.notifications}
        reports={data.reports}
        referralCount={data.referralCount}
        shopOrders={data.shopOrders}
      />
    </>
  );
}
