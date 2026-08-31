import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ru-force-light min-h-dvh bg-[#F5F5F5] font-[family-name:var(--font-sans)] text-[#111111]">
      {children}
      <CustomerTabBar />
    </div>
  );
}
