import { DriverAppProvider } from "@/components/driver/driver-app-provider";
import { DriverTabBar } from "@/components/driver/driver-tab-bar";
import { DriverGate } from "@/components/driver/driver-gate";
import { DriverOnboardingGate } from "@/components/driver/driver-onboarding-gate";

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DriverAppProvider>
      <div className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] font-[family-name:var(--font-sans)] text-[var(--ru-ink)]">
        <DriverGate>
          <DriverOnboardingGate>{children}</DriverOnboardingGate>
        </DriverGate>
        <DriverTabBar />
      </div>
    </DriverAppProvider>
  );
}
