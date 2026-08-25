import { notFound } from "next/navigation";
import { LiveTrip } from "@/components/live-trip";
import { getJobByReference, getRatingForJob } from "@/lib/actions";

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

  return (
    <div className="ru-force-light relative min-h-dvh bg-white text-slate-900">
      <main className="mx-auto max-w-md">
        <LiveTrip initialJob={job} initialRating={rating} />
      </main>
    </div>
  );
}
