import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
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
    <>
      <SiteNav />
      <main className="mx-auto max-w-lg px-4 py-8">
        <LiveTrip initialJob={job} initialRating={rating} />
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/book" className="ru-btn ru-btn-primary w-full">
            Request another trip
          </Link>
        </div>
      </main>
    </>
  );
}
