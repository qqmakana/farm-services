"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { resetOnboardingForReplay } from "@/lib/onboarding";
import {
  UBER_BADGE,
  UBER_GLOSS,
  UBER_H1,
  UBER_H2,
  UBER_PAGE,
} from "@/components/customer/uber-chrome";
import { UberServiceCircle } from "@/components/customer/uber-service-circle";
import { DriveSignupCard } from "@/components/driver/drive-signup-card";

const GO_ANYWHERE = [
  { href: "/ride", title: "Trip", src: "/home/icons/car.png" },
  { href: "/ride?when=later", title: "Reserve", src: "/home/icons/car.png" },
  { href: "/group", title: "Groups", src: "/home/icons/car.png" },
  { href: "/farm", title: "Farm", src: "/home/icons/farm.png" },
] as const;

const DELIVERED = [
  { href: "/shops", title: "Shops", src: "/home/icons/shops.png" },
  { href: "/delivery", title: "Delivery", src: "/home/icons/courier.png" },
  { href: "/courier", title: "Courier", src: "/home/icons/courier.png" },
  { href: "/farm", title: "Farm", src: "/home/icons/farm.png" },
  { href: "/shops", title: "Hardware", src: "/home/icons/shops.png" },
  { href: "/shops", title: "Spaza", src: "/home/icons/shops.png" },
  { href: "/farm", title: "Feed", src: "/home/icons/farm.png" },
  { href: "/shops", title: "Clinic run", src: "/home/icons/shops.png" },
] as const;

function ServicesContent() {
  const router = useRouter();

  return (
    <main className={UBER_PAGE}>
      <h1 className={UBER_H1}>Services</h1>

      <section className="mt-6">
        <h2 className={UBER_H2}>Go anywhere</h2>
        <Link
          href="/ride"
          className={`uber-press relative mt-4 block overflow-hidden rounded-[28px] bg-[#0a0a0a] p-5 text-white ${UBER_GLOSS}`}
        >
          <span className={`absolute top-3 right-3 ${UBER_BADGE}`}>20%</span>
          <span className="block pr-16 text-[15px] font-bold">
            Get 20% off 10 trips
          </span>
          <span className="mt-1 block pr-16 text-[13px] font-medium text-white/70">
            Start with Village Pass · Ride, Delivery, Farm or Courier · cash or
            card
          </span>
        </Link>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {GO_ANYWHERE.map((item) => (
            <UberServiceCircle
              key={item.title}
              href={item.href}
              label={item.title}
              src={item.src}
              testId={`service-circle-${item.title.toLowerCase()}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className={UBER_H2}>Get anything delivered</h2>
        <div className="mt-5 grid grid-cols-4 gap-x-2 gap-y-5">
          {DELIVERED.map((item) => (
            <UberServiceCircle
              key={item.title}
              href={item.href}
              label={item.title}
              src={item.src}
            />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className={UBER_H2}>Get Courier to help</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="/courier"
            className={`uber-press relative flex min-h-[9rem] flex-col justify-between overflow-hidden rounded-[28px] p-4 ${UBER_GLOSS}`}
          >
            <span className={`absolute top-3 right-3 ${UBER_BADGE}`}>20%</span>
            <span>
              <span className="block text-[15px] font-bold text-[#0a0a0a]">
                Send items
              </span>
              <span className="mt-1 block text-[13px] font-medium text-[#6b6b6b]">
                Person-to-person courier
              </span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/courier.png"
              alt=""
              className="h-12 w-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
            />
          </Link>
          <Link
            href="/shops"
            className={`uber-press flex min-h-[9rem] flex-col justify-between rounded-[28px] p-4 ${UBER_GLOSS}`}
          >
            <span>
              <span className="block text-[15px] font-bold text-[#0a0a0a]">
                Store pick-up
              </span>
              <span className="mt-1 block text-[13px] font-medium text-[#6b6b6b]">
                Order from a local shop
              </span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/home/icons/shops.png"
              alt=""
              className="h-12 w-12 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.12)]"
            />
          </Link>
        </div>
      </section>

      <DriveSignupCard variant="compact" className="mt-8" />

      <button
        type="button"
        onClick={() => {
          resetOnboardingForReplay();
          router.push("/onboarding?replay=1");
        }}
        className="uber-press mt-4 flex w-full items-center justify-center gap-1 py-3 text-[13px] font-semibold text-[#6b6b6b]"
      >
        See how it works
        <ChevronRight className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
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
