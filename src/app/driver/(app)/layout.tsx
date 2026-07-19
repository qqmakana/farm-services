import { DriverAppProvider } from "@/components/driver/driver-app-provider";
import { DriverTabBar } from "@/components/driver/driver-tab-bar";
import { DriverGate } from "@/components/driver/driver-gate";

export default function DriverAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DriverAppProvider>
      <div className="min-h-dvh bg-[#F9FAFB] font-[system-ui,Segoe_UI,sans-serif] text-slate-900">
        <DriverGate>{children}</DriverGate>
        <DriverTabBar />
      </div>
    </DriverAppProvider>
  );
}
