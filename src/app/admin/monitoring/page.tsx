import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { getAdminMonitoringData } from "@/lib/actions-ops";

export const dynamic = "force-dynamic";

export default async function AdminMonitoringPage() {
  const data = await getAdminMonitoringData();
  if (!data.gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link href="/login?next=/admin/monitoring" className="mt-6 inline-block text-[#1A4D3A] underline">
            Sign in
          </Link>
        </main>
      </>
    );
  }

  const h = data.health!;

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-3xl px-4 py-8 pb-20">
        <h1 className="text-2xl font-bold">Health monitoring</h1>
        <p className="mt-1 text-sm text-slate-600">
          Live checks · public endpoint{" "}
          <code className="rounded bg-slate-100 px-1">/api/health</code>
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Status ok={h.apiOk} label={`API ${h.apiMs}ms`} />
          <Status ok={h.dbOk} label={`Database ${h.dbMs}ms`} />
          <Status ok={h.fcmConfigured} label="FCM configured" />
          <Status ok={!h.mockMode} label={h.mockMode ? "Mock mode" : "Live Supabase"} />
        </div>

        <div className="mt-6 rounded-xl border bg-white p-4">
          <p className="text-sm">
            Errors (24h): <strong>{h.errorsLast24}</strong>
          </p>
          <p className="mt-1 text-sm">
            Critical unfixed: <strong>{h.criticalUnfixed}</strong>
          </p>
          <Link href="/admin/errors" className="mt-3 inline-block text-sm font-semibold text-[#1A4D3A] underline">
            Open error inbox
          </Link>
        </div>
      </main>
    </>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div
      className={`rounded-xl border p-4 text-sm font-semibold ${
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {ok ? "●" : "○"} {label}
    </div>
  );
}
