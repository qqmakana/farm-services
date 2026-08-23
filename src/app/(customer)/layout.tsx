import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ru-force-light min-h-dvh bg-[#F3F3F3] font-[family-name:var(--font-sans)] tracking-[-0.02em] text-black">
      {children}
      <CustomerTabBar />
    </div>
  );
}
