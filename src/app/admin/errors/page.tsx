import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import {
  adminMarkErrorFixed,
  getAdminErrorsData,
} from "@/lib/actions-ops";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

type Filter = "all" | "unresolved" | "fixed";

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = (["all", "unresolved", "fixed"].includes(sp.status ?? "")
    ? sp.status
    : "unresolved") as Filter;
  const q = (sp.q ?? "").trim().toLowerCase();

  const data = await getAdminErrorsData();
  if (!data.gate.ok) {
    return (
      <>
        <SiteNav active="admin" />
        <main className="mx-auto max-w-lg px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Admin access required</h1>
          <Link
            href="/login?next=/admin/errors"
            className="mt-6 inline-block text-[#1A4D3A] underline"
          >
            Sign in
          </Link>
        </main>
      </>
    );
  }

  async function markFixed(formData: FormData) {
    "use server";
    const id = String(formData.get("id") || "");
    if (id) await adminMarkErrorFixed(id);
  }

  const filtered = data.errors.filter((raw) => {
    const e = raw as {
      message?: string;
      context?: string | null;
      severity?: string;
      fixed?: boolean;
      url?: string | null;
    };
    if (status === "unresolved" && e.fixed) return false;
    if (status === "fixed" && !e.fixed) return false;
    if (!q) return true;
    const hay = `${e.message ?? ""} ${e.context ?? ""} ${e.url ?? ""} ${e.severity ?? ""}`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <>
      <SiteNav active="admin" />
      <main className="mx-auto max-w-4xl px-4 py-8 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Error inbox</h1>
          <a
            href={`mailto:${BRAND.email}?subject=Village%20Ride%20errors`}
            className="text-sm font-semibold text-[#1A4D3A] underline"
          >
            Email ops
          </a>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Critical errors also hit PARTNER_EMAIL_WEBHOOK when configured.
        </p>

        <form className="mt-5 flex flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search message, URL, context…"
            className="min-w-[200px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="unresolved">Unresolved</option>
            <option value="fixed">Fixed</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
          >
            Filter
          </button>
        </form>

        <div className="mt-3 flex gap-3 text-xs font-semibold text-slate-500">
          <Link href="/admin/errors?status=unresolved" className="underline">
            Unresolved
          </Link>
          <Link href="/admin/errors?status=fixed" className="underline">
            Fixed
          </Link>
          <Link href="/admin/errors?status=all" className="underline">
            All
          </Link>
        </div>

        <ul className="mt-6 space-y-3">
          {filtered.length === 0 ? (
            <li className="text-sm text-slate-500">No errors match this filter.</li>
          ) : (
            filtered.map((raw) => {
              const e = raw as {
                id: string;
                message: string;
                severity?: string;
                context?: string | null;
                url?: string | null;
                fixed?: boolean;
                created_at?: string;
                stack?: string | null;
              };
              return (
                <li
                  key={e.id}
                  className={`rounded-xl border p-4 ${
                    e.fixed
                      ? "border-slate-100 bg-slate-50 opacity-70"
                      : "border-rose-100 bg-white"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">
                        {e.severity ?? "error"} · {e.created_at}
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {e.message}
                      </p>
                      {e.context ? (
                        <p className="mt-1 text-xs text-slate-600">{e.context}</p>
                      ) : null}
                      {e.url ? (
                        <p className="mt-1 font-mono text-[11px] text-slate-500">
                          {e.url}
                        </p>
                      ) : null}
                    </div>
                    {!e.fixed ? (
                      <form action={markFixed}>
                        <input type="hidden" name="id" value={e.id} />
                        <button
                          type="submit"
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
                        >
                          Mark fixed
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700">
                        Fixed
                      </span>
                    )}
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </main>
    </>
  );
}
