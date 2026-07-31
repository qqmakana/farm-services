import Link from "next/link";
import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";
import { TrustBadges } from "@/components/trust-badges";
import { OnboardingGate } from "@/components/onboarding/onboarding-gate";

export default function HomePage() {
  return (
    <OnboardingGate>
      <UberShell showTabBar>
        <div className="space-y-5">
          <ServiceHomeSheet />
          <TrustBadges />
          <p className="px-1 text-center text-xs text-slate-500">
            <Link
              href="/onboarding?replay=1"
              className="font-semibold text-black underline underline-offset-2"
            >
              Learn how Village Ride works
            </Link>
          </p>
        </div>
      </UberShell>
    </OnboardingGate>
  );
}
