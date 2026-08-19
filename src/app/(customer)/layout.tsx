import { CustomerTabBar } from "@/components/customer/customer-tab-bar";
import { DriverWantedNotice } from "@/components/driver-wanted-notice";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ru-force-light min-h-dvh bg-[#f2f2f2] font-[family-name:var(--font-display)] tracking-[-0.02em] text-[#0a0a0a]">
      {children}
      <CustomerTabBar />
      <DriverWantedNotice />
    </div>
  );
}
