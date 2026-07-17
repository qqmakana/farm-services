import { SiteNav } from "@/components/site-nav";
import { ApplicationsPanel } from "@/components/applications-panel";
import { DispatchBoard } from "@/components/dispatch-board";
import { HireQueue } from "@/components/hire-queue";
import {
  getDataSource,
  listApplications,
  listDrivers,
  listJobs,
  listPendingDriverHires,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const [jobs, drivers, applications, pendingHires, source] = await Promise.all(
    [
      listJobs(),
      listDrivers(),
      listApplications(),
      listPendingDriverHires(),
      getDataSource(),
    ],
  );

  const newCount = jobs.filter((j) => j.status === "new").length;

  return (
    <>
      <SiteNav active="dispatch" />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Operations
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
              Dispatch
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Hire drivers, override trip matching, WhatsApp, watch the ledger.
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>
              <span className="font-semibold text-rose-700">{newCount}</span>{" "}
              unassigned jobs
            </p>
            <p className="text-xs text-slate-400">
              Backend: {source === "supabase" ? "Supabase" : "Local"}
            </p>
          </div>
        </div>

        <HireQueue applicants={pendingHires} />
        <ApplicationsPanel applications={applications} />
        <DispatchBoard jobs={jobs} drivers={drivers} />
      </main>
    </>
  );
}
