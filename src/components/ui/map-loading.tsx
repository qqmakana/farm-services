export function MapLoading({
  label = "Loading map",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex h-full min-h-48 w-full flex-col items-center justify-center gap-3 bg-[#E5E3DF] text-[#666666] ${className}`}
    >
      <span className="vr-map-pulse" aria-hidden />
      <p className="text-[13px] font-medium">{label}…</p>
    </div>
  );
}
