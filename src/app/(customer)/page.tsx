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
        </div>
      </UberShell>
    </OnboardingGate>
  );
}
