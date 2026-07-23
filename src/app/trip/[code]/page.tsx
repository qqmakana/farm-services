import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { LiveTrip } from "@/components/live-trip";
import { getJobByReference, getRatingForJob } from "@/lib/actions";
import { isSearchingStatus } from "@/lib/job-status";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const job = await getJobByReference(code);
  if (!job) notFound();
  const rating = await getRatingForJob(job.id);
  const stillSearching =
    isSearchingStatus(job.status) && !job.dispatch_exhausted;

  return (
    <>
      <SiteNav />
      <main className="min-h-dvh bg-white text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-8 pb-16">
          <LiveTrip initialJob={job} initialRating={rating} />
          {!stillSearching ? (
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href={
                  job.service_type === "delivery"
                    ? "/delivery"
                    : job.service_type === "farm"
                      ? "/farm"
                      : job.service_type === "courier"
                        ? "/courier"
                        : "/ride"
                }
                className="ru-btn ru-btn-primary w-full text-center"
              >
                Request another trip
              </Link>
              <Link
                href="/"
                className="text-center text-sm font-semibold text-[#1A4D3A]"
              >
                Back to home
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
