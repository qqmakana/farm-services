import { TripLiveGate } from "@/components/trip/trip-live-gate";

export const dynamic = "force-dynamic";

export default async function TripPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="ru-force-light relative min-h-dvh bg-white text-slate-900">
      <main className="mx-auto max-w-md">
        <TripLiveGate code={code} />
      </main>
    </div>
  );
}
