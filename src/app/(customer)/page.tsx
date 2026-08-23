import { OnboardingGate } from "@/components/onboarding/onboarding-gate";
import { UberHome } from "@/components/customer/uber-home";

export default function HomePage() {
  return (
    <OnboardingGate>
      <UberHome />
    </OnboardingGate>
  );
}
