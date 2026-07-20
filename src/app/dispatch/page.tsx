import { SiteNav } from "@/components/site-nav";
import { ApplicationsPanel } from "@/components/applications-panel";
import { DispatchBoard } from "@/components/dispatch-board";
import { HireQueue } from "@/components/hire-queue";
import {
  getDataSource,
  listAllDriversForOps,
  listApplications,
  listDrivers,
  listJobs,
} from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const [jobs, drivers, applications, allDrivers, source] = await Promise.all([
    listJobs(),
    listDrivers(),
    listApplications(),
    listAllDriversForOps(),
    getDataSource(),
  ]);

  const newCount = jobs.filter(
    (j) => j.status === "new" || j.status === "searching_driver",
  ).length;
  const approvedCount = allDrivers.filter(
    (d) => d.approval_status === "approved",
  ).length;

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
              Jobs · drivers ·{" "}
              <a
                href="/admin/verifications"
                className="font-semibold text-[#1A4D3A] underline"
              >
                ID verifications
              </a>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              See who applied in the app, who the app approved, jobs, and
              WhatsApp.
            </p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>
              <span className="font-semibold text-emerald-800">
                {approvedCount}
              </span>{" "}
              approved drivers ·{" "}
              <span className="font-semibold text-rose-700">{newCount}</span>{" "}
              open jobs
            </p>
            <p className="text-xs text-slate-400">
              Backend: {source === "supabase" ? "Supabase" : "Local"}
            </p>
          </div>
        </div>

        <HireQueue drivers={allDrivers} />
        <ApplicationsPanel applications={applications} />
        <DispatchBoard jobs={jobs} drivers={drivers} />
      </main>
    </>
  );
}
