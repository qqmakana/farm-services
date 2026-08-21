import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { HomeMapShell } from "@/components/uber/home-map-shell";

export default function HomePage() {
  return (
    <OnboardingGate>
      <HomeMapShell />
    </OnboardingGate>
  );
}
