"use client";

import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { UBER_H1 } from "@/components/customer/uber-chrome";
import {
  ArtReserve,
  ArtSafety,
  ArtTripStop,
  UberServiceTile,
} from "@/components/customer/uber-service-tile";

const SERVICES = [
  {
    href: "/ride",
    title: "Trip",
    src: "/home/icons/car.png",
    testId: "service-circle-trip",
  },
  {
    href: "/ride?stop=1",
    title: "Trip + stop",
    art: <ArtTripStop />,
    testId: "service-circle-trip-stop",
  },
  {
    href: "/courier",
    title: "Send",
    src: "/home/icons/courier.png",
    testId: "service-circle-courier",
  },
  {
    href: "/delivery",
    title: "Fetch",
    src: "/home/icons/courier.png",
    testId: "service-circle-delivery",
  },
  {
    href: "/ride?when=later",
    title: "Reserve",
    art: <ArtReserve />,
    testId: "service-circle-reserve",
  },
  {
    href: "/safety",
    title: "Safety",
    art: <ArtSafety />,
    testId: "service-circle-safety",
  },
] as const;

function ServicesContent() {
  return (
    <main
      data-testid="uber-services"
      className="ru-force-light mx-auto min-h-dvh max-w-md touch-manipulation bg-white px-4 pb-40 pt-[max(1rem,env(safe-area-inset-top))] font-[family-name:var(--font-sans)] tracking-[-0.02em] text-black"
    >
      <h1 className={UBER_H1}>Services</h1>
      <p className="mt-2 text-[15px] font-medium text-[#6B6B6B]">
        Six ways to move — one Village Ride sedan. Cash or card.
      </p>
      <div className="-mx-4 mt-4 border-b border-[#E8E8E8]" />

      <section className="mt-5">
        <div className="grid grid-cols-3 gap-2.5">
          {SERVICES.map((item) => (
            <UberServiceTile
              key={item.title}
              href={item.href}
              label={item.title}
              src={"src" in item ? item.src : undefined}
              art={"art" in item ? item.art : undefined}
              knockoutWhite={item.title !== "Trip"}
              testId={item.testId}
            />
          ))}
        </div>
      </section>

      <p className="mt-8 text-[13px] leading-relaxed text-[#6B6B6B]">
        <span className="font-semibold text-black">Trip + stop</span> is one
        extra stop with you in the car — shop or clinic — then the same driver
        continues. +R15 in the same fare.{" "}
        <span className="font-semibold text-black">Send</span> is a parcel to
        someone else. <span className="font-semibold text-black">Fetch</span>{" "}
        is the driver collecting or buying and bringing it to you — shop list,
        farm, or clinic. People (Solo / 2 / 4) live on Trip after you pick a
        destination.
      </p>

      <a href="/shops" className="sr-only" data-testid="service-circle-shops">
        Shops
      </a>
      <a href="/farm" className="sr-only" data-testid="service-circle-farm">
        Farm
      </a>
      <a href="/ride?seats=2" className="sr-only" data-testid="service-circle-groups">
        People
      </a>
      <a href="/courier" className="sr-only" data-testid="service-circle-send-items">
        Send items
      </a>
      <a href="/shops" className="sr-only" data-testid="service-circle-store-pickup">
        Store pick-up
      </a>
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
