import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";
import { TrustBadges } from "@/components/trust-badges";

export default function HomePage() {
  return (
    <UberShell showTabBar>
      <div className="space-y-5">
        <ServiceHomeSheet />
        <TrustBadges />
      </div>
    </UberShell>
  );
}
