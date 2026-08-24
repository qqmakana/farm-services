"use client";

import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { UBER_H1 } from "@/components/customer/uber-chrome";
import {
  ArtClinic,
  ArtFeed,
  ArtGrocery,
  ArtGroups,
  ArtHardware,
  ArtReserve,
  ArtSpaza,
  UberFeatureTile,
  UberServiceTile,
} from "@/components/customer/uber-service-tile";

const GO = [
  {
    href: "/ride",
    title: "Trip",
    src: "/home/icons/car.png",
    badge: "20%",
    testId: "service-circle-trip",
  },
  {
    href: "/ride?when=later",
    title: "Reserve",
    art: <ArtReserve />,
    testId: "service-circle-reserve",
  },
  {
    href: "/group",
    title: "Groups",
    art: <ArtGroups />,
    testId: "service-circle-groups",
  },
  {
    href: "/farm",
    title: "Farm",
    src: "/home/icons/farm.png",
    testId: "service-circle-farm",
  },
] as const;

const DELIVERED_ROW1 = [
  {
    href: "/shops",
    title: "Shops",
    src: "/home/icons/shops.png",
    testId: "service-circle-shops",
  },
  {
    href: "/delivery",
    title: "Delivery",
    src: "/home/icons/courier.png",
    testId: "service-circle-delivery",
  },
  {
    href: "/delivery?kind=shop",
    title: "Grocery",
    art: <ArtGrocery />,
    testId: "service-circle-grocery",
  },
] as const;

const DELIVERED_ROW2 = [
  {
    href: "/delivery",
    title: "Hardware",
    art: <ArtHardware />,
    testId: "service-circle-hardware",
  },
  {
    href: "/shops",
    title: "Spaza",
    art: <ArtSpaza />,
    testId: "service-circle-spaza",
  },
  {
    href: "/farm",
    title: "Feed",
    art: <ArtFeed />,
    testId: "service-circle-feed",
  },
  {
    href: "/courier",
    title: "Clinic",
    art: <ArtClinic />,
    testId: "service-circle-clinic",
  },
] as const;

function ServicesContent() {
  return (
    <main
      data-testid="uber-services"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-40 pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] tracking-[-0.02em] text-black"
    >
      <h1 className={UBER_H1}>Services</h1>
      <div className="-mx-4 mt-4 border-b border-[#E8E8E8]" />

      <section className="mt-5">
        <div className="grid grid-cols-4 gap-2.5">
          {GO.map((item) => (
            <UberServiceTile
              key={item.title}
              href={item.href}
              label={item.title}
              src={"src" in item ? item.src : undefined}
              art={"art" in item ? item.art : undefined}
              badge={"badge" in item ? item.badge : undefined}
              knockoutWhite={item.title !== "Trip"}
              testId={item.testId}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] font-bold leading-snug tracking-[-0.2px] text-black">
          Get anything delivered
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {DELIVERED_ROW1.map((item) => (
            <UberServiceTile
              key={item.title}
              href={item.href}
              label={item.title}
              src={"src" in item ? item.src : undefined}
              art={"art" in item ? item.art : undefined}
              knockoutWhite
              testId={item.testId}
            />
          ))}
        </div>
        <div className="mt-5 grid grid-cols-4 gap-2.5">
          {DELIVERED_ROW2.map((item) => (
            <UberServiceTile
              key={item.title}
              href={item.href}
              label={item.title}
              art={item.art}
              testId={item.testId}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[18px] font-bold leading-snug tracking-[-0.2px] text-black">
          Get Courier to help
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <UberFeatureTile
            href="/courier"
            title="Send items"
            sub="Documents or a small package"
            src="/home/icons/courier.png"
            testId="service-circle-send-items"
          />
          <UberFeatureTile
            href="/shops"
            title="Store pick-up"
            sub="I know the shop, or find one"
            src="/home/icons/shops.png"
            testId="service-circle-store-pickup"
          />
        </div>
      </section>
    </main>
  );
}

export default function ServicesPage() {
  return (
    <OnboardingGate>
      <ServicesContent />
    </OnboardingGate>
  );
}
