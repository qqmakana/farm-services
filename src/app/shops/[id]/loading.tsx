import { ShopCardSkeleton } from "@/components/ui/skeleton";

export default function ShopMenuLoading() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-[#F5F5F5] px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="h-11 w-11 rounded-full bg-[#E0E0E0]" />
      <ShopCardSkeleton />
    </main>
  );
}
