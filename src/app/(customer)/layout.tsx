import { CustomerTabBar } from "@/components/customer/customer-tab-bar";
import { DriverWantedNotice } from "@/components/driver-wanted-notice";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ru-force-light min-h-dvh bg-[#f3f3f3] font-sans font-[family-name:var(--font-sans)] text-[#0a0a0a]">
      {children}
      <CustomerTabBar />
      <DriverWantedNotice />
    </div>
  );
}
