import { UberShell } from "@/components/uber/uber-shell";
import { ServiceHomeSheet } from "@/components/uber/service-home";

export default function HomePage() {
  return (
    <UberShell showTabBar>
      <ServiceHomeSheet />
    </UberShell>
  );
}
