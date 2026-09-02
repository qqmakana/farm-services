import { Clock } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { UBER_H1, UBER_PAGE } from "@/components/customer/uber-chrome";

export default function ActivityLoading() {
  return (
    <main className={UBER_PAGE}>
      <h1 className={UBER_H1}>Activity</h1>
      <EmptyState
        icon={Clock}
        title="No trips yet"
        body="Your trip history will appear here"
      />
    </main>
  );
}
