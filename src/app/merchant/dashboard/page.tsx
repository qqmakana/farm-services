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
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Merchant sign-in required</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in with your business email to open the dashboard.
          </p>
          <Link
            href="/login?next=/merchant/dashboard"
            className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white"
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
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Merchant access required</h1>
          <p className="mt-2 text-sm text-slate-600">
            This account is <strong>{data.role}</strong>, not a merchant. Register
            a shop from the Sell page, or ask ops to set{" "}
            <code className="rounded bg-slate-100 px-1">role=merchant</code>.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-xl bg-[#1A4D3A] px-5 py-3 text-sm font-bold text-white"
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
      />
    </>
  );
}
