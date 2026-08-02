"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Car,
  CircleDot,
  Download,
  Package,
  Tractor,
  Truck,
  Users,
} from "lucide-react";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { useInstallActions } from "@/components/install-share-bar";
import { PageShell } from "@/components/ui/page-shell";
import { resetOnboardingForReplay } from "@/lib/onboarding";

const cards = [
  {
    href: "/ride",
    title: "Village Ride",
    subtitle: "Night rides & village trips",
    Icon: Car,
  },
  {
    href: "/delivery",
    title: "Village Delivery",
    subtitle: "Goods, furniture & materials",
    Icon: Truck,
  },
  {
    href: "/farm",
    title: "Farm Connect",
    subtitle: "Produce, livestock & equipment",
    Icon: Tractor,
  },
  {
    href: "/courier",
    title: "Courier",
    subtitle: "Packages — village, town & city",
    Icon: Package,
  },
  {
    href: "/group",
    title: "Group Rides",
    subtitle: "Split the fare · shared loads",
    Icon: Users,
  },
  {
    href: "/driver/join",
    title: "Become a Driver",
    subtitle: "Earn with Village Ride",
    Icon: CircleDot,
  },
] as const;

function ServicesContent() {
  const router = useRouter();
  const { standalone, installing, install } = useInstallActions();

  function openTour() {
    resetOnboardingForReplay();
    router.push("/onboarding?replay=1");
  }

  return (
    <PageShell
      title="What do you need today?"
      subtitle="Choose a service. Cash to the driver. Same app for ride, delivery, farm & courier."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        {!standalone ? (
          <button
            type="button"
            onClick={install}
            disabled={installing}
            className="ru-btn ru-btn-primary ru-btn-block"
          >
            <Download className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            {installing ? "Starting…" : "Install app"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={openTour}
          className="ru-btn ru-btn-secondary ru-btn-block"
        >
          See feature tour
          <ArrowUpRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </button>
      </div>

      <div className="ru-list mt-6">
        {cards.map((card) => {
          const Icon = card.Icon;
          return (
            <Link key={card.href} href={card.href} className="ru-row w-full">
              <span className="ru-icon-circle">
                <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold tracking-tight text-black">
                  {card.title}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--ru-muted)]">
                  {card.subtitle}
                </span>
              </span>
              <ArrowUpRight
                className="h-4 w-4 shrink-0 text-[var(--ru-muted)]"
                strokeWidth={2}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-center text-[11px] tracking-wide text-[var(--ru-muted)]">
        Google Play coming soon · Install now from this page
      </p>
    </PageShell>
  );
}

export default function ServicesPage() {
  return (
    <OnboardingGate>
      <ServicesContent />
    </OnboardingGate>
  );
}
