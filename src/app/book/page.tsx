import { SiteNav } from "@/components/site-nav";
import { BookingForm } from "@/components/booking-form";
import type { ServiceType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const sp = await searchParams;
  const raw = sp.service;
  const initialService: ServiceType =
    raw === "farm" || raw === "delivery" || raw === "ride" ? raw : "ride";

  const titles: Record<ServiceType, { title: string; sub: string }> = {
    ride: {
      title: "Request a ride",
      sub: "People only — village ↔ town. PayPal → auto-match a car.",
    },
    delivery: {
      title: "Send goods",
      sub: "Furniture, appliances, parcels. Bakkie or truck.",
    },
    farm: {
      title: "Farm Connect",
      sub: "Order farm products. Pickup at the farm gate. Bakkie delivery.",
    },
  };

  const copy = titles[initialService];

  return (
    <>
      <SiteNav active={initialService === "farm" ? "farm" : "book"} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
          {initialService === "farm" ? "Farm" : "Customer"}
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{copy.sub}</p>
        <div className="ru-card mt-6 p-5 sm:p-6">
          <BookingForm
            initialService={initialService}
            lockService={Boolean(raw)}
          />
        </div>
      </main>
    </>
  );
}
