import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: `How ${BRAND.appName} works`,
  description: "Request. Connect. Get it done — rides, delivery, and farm transport.",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
