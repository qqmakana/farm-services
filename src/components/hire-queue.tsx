"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  approveDriverHire,
  getDriverDocSignedUrl,
  rejectDriverHire,
  rerunDriverKyc,
  setDriverIdVerified,
} from "@/lib/actions";
import { DriverVerifiedBadge } from "@/components/driver-verified-badge";
import type { Driver, DriverApprovalStatus } from "@/lib/types";
import { VEHICLE_LABELS } from "@/lib/vehicles";

type Filter = "all" | DriverApprovalStatus | "docs";

function needsDocReview(d: Driver): boolean {
  if (!d.docs_submitted_at) return false;
  if (d.kyc_status === "needs_review" || d.kyc_status === "pending") {
    return true;
  }
  return !d.id_verified;
}

function kycBadge(d: Driver): { label: string; className: string } | null {
  switch (d.kyc_status) {
    case "auto_approved":
      return {
        label: "AI KYC ✓",
        className: "bg-emerald-100 text-emerald-900",
      };
    case "manual_approved":
      return {
        label: "Manual KYC ✓",
        className: "bg-emerald-100 text-emerald-900",
      };
    case "needs_review":
      return {
        label: "KYC review",
        className: "bg-amber-100 text-amber-950",
      };
    case "pending":
      return {
        label: "KYC scanning…",
        className: "bg-sky-100 text-sky-900",
      };
    case "rejected":
      return {
        label: "KYC rejected",
        className: "bg-rose-100 text-rose-900",
      };
    default:
      return null;
  }
}

function statusLabel(status: DriverApprovalStatus) {
  switch (status) {
    case "approved":
      return "Approved by app";
    case "pending":
      return "Pending";
    case "rejected":
      return "Rejected";
  }
}

function statusClass(status: DriverApprovalStatus) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-900";
    case "pending":
      return "bg-amber-100 text-amber-950";
    case "rejected":
      return "bg-rose-100 text-rose-900";
  }
}

function when(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HireQueue({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: drivers.length,
      approved: drivers.filter((d) => d.approval_status === "approved").length,
      pending: drivers.filter((d) => d.approval_status === "pending").length,
      rejected: drivers.filter((d) => d.approval_status === "rejected").length,
      docs: drivers.filter(needsDocReview).length,
    };
  }, [drivers]);

  const visible = useMemo(() => {
    if (filter === "all") return drivers;
    if (filter === "docs") {
      return drivers.filter(needsDocReview);
    }
    return drivers.filter((d) => d.approval_status === filter);
  }, [drivers, filter]);

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    });
  }

  function openDoc(path: string | null | undefined) {
    if (!path) return;
    startTransition(async () => {
      try {
        const url = await getDriverDocSignedUrl(path);
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open document");
      }
    });
  }

  const filters: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "Everyone in app", count: counts.all },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "docs", label: "Docs to review", count: counts.docs },
    { key: "pending", label: "Pending", count: counts.pending },
    { key: "rejected", label: "Rejected", count: counts.rejected },
  ];

  return (
    <section className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">
        Drivers in the app
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        SA numbers are auto-approved to drive. AI scans ID/license on upload —
        auto-verifies when name + expiry check out, otherwise flags{" "}
        <strong>Docs to review</strong>.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === f.key
                ? "bg-[var(--ru-brand)] text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </p>
      )}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          No drivers in this filter yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-emerald-100 overflow-hidden rounded-lg border border-emerald-100 bg-white">
          {visible.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-start justify-between gap-3 px-3 py-3 text-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-slate-900">{d.full_name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(d.approval_status)}`}
                  >
                    {statusLabel(d.approval_status)}
                  </span>
                  <DriverVerifiedBadge verified={d.id_verified} compact />
                  {(() => {
                    const badge = kycBadge(d);
                    return badge ? (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    ) : null;
                  })()}
                  {d.is_online && (
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-900">
                      Online now
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-slate-600">
                  {d.phone} · {VEHICLE_LABELS[d.vehicle_type]}
                  {d.license_number ? ` · License ${d.license_number}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Opt-in:{" "}
                  {[
                    d.prefer_night !== false && "Night",
                    d.prefer_heavy !== false && "Heavy",
                    d.prefer_village_routes !== false && "Village",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "None"}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Applied {when(d.created_at)}
                  {d.docs_submitted_at
                    ? ` · Docs ${when(d.docs_submitted_at)}`
                    : " · No docs yet"}
                  {d.kyc_name_on_docs
                    ? ` · OCR name: ${d.kyc_name_on_docs}`
                    : ""}
                  {d.kyc_license_expiry
                    ? ` · Expiry ${d.kyc_license_expiry}`
                    : ""}
                </p>
                {Array.isArray(d.kyc_issues) && d.kyc_issues.length > 0 ? (
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-900">
                    {d.kyc_issues.slice(0, 4).map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {d.id_doc_url ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-700 underline"
                      onClick={() => openDoc(d.id_doc_url)}
                    >
                      View ID
                    </button>
                  ) : null}
                  {d.license_doc_url ? (
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-700 underline"
                      onClick={() => openDoc(d.license_doc_url)}
                    >
                      View license
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {d.docs_submitted_at ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => rerunDriverKyc(d.id))}
                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-900 disabled:opacity-50"
                  >
                    Re-run AI KYC
                  </button>
                ) : null}
                {!d.id_verified && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setDriverIdVerified(d.id, true))}
                    className="rounded-md bg-[#1A4D3A] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#163d2e] disabled:opacity-50"
                  >
                    Mark verified
                  </button>
                )}
                {d.id_verified && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => setDriverIdVerified(d.id, false))}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 disabled:opacity-50"
                  >
                    Unverify
                  </button>
                )}
                {d.approval_status !== "approved" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => approveDriverHire(d.id))}
                    className="rounded-md bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                )}
                {d.approval_status !== "rejected" && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      run(() => rejectDriverHire(d.id, "Removed by ops"))
                    }
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Reject
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
