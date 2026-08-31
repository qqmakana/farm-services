import { ActivityRowSkeleton } from "@/components/ui/skeleton";
import { UBER_H1, UBER_PAGE } from "@/components/customer/uber-chrome";

export default function ActivityLoading() {
  return (
    <main className={UBER_PAGE}>
      <h1 className={UBER_H1}>Activity</h1>
      <div className="vr-overscroll mt-6 space-y-4" aria-busy="true">
        <ActivityRowSkeleton />
        <ActivityRowSkeleton />
        <ActivityRowSkeleton />
      </div>
    </main>
  );
}
