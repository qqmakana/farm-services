import { SiteNav } from "@/components/site-nav";
import { DriverApplyForm } from "@/components/driver-apply-form";
import { DriverBoard } from "@/components/driver-board";
import { listDrivers, listJobs } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function DriverPage() {
  const [drivers, jobs] = await Promise.all([listDrivers(), listJobs()]);

  return (
    <>
      <SiteNav active="driver" />
      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
            Driver app
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Apply · go online · earn
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            New drivers apply first. Once ops approves you, go online and accept
            trips — matching is automatic.
          </p>
        </div>

        <DriverApplyForm />

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Already approved?
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Select your name, go online, Accept/Decline offers.
          </p>
          <div className="mt-4">
            <DriverBoard drivers={drivers} jobs={jobs} />
          </div>
        </div>
      </main>
    </>
  );
}
