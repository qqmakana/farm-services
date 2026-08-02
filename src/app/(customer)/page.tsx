import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { HomeMapShell } from "@/components/uber/home-map-shell";
import { TrustBadges } from "@/components/trust-badges";

export default function HomePage() {
  return (
    <OnboardingGate>
      <HomeMapShell trust={<TrustBadges />} />
    </OnboardingGate>
  );
}
