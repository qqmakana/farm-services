import { CustomerTabBar } from "@/components/customer/customer-tab-bar";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#F9FAFB] font-[system-ui,Segoe_UI,sans-serif] text-slate-900">
      {children}
      <CustomerTabBar />
    </div>
  );
}
