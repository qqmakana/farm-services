import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ru-force-light min-h-dvh bg-[var(--ru-canvas)] font-[family-name:var(--font-sans)] text-[var(--ru-ink)]">
      {children}
      <CustomerTabBar />
    </div>
  );
}
