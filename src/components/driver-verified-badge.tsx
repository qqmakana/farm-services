/** Trust badge for matched drivers — uses id_verified from rr_drivers. */
export function DriverVerifiedBadge({
  verified,
  compact = false,
}: {
  verified: boolean;
  compact?: boolean;
}) {
  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 font-medium text-emerald-800 ${
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
        }`}
        title="ID & License Verified"
      >
        <svg
          viewBox="0 0 20 20"
          className={compact ? "h-3 w-3" : "h-3.5 w-3.5"}
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        {compact ? "Verified" : "ID & License Verified"}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 font-medium text-slate-500 ${
        compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}
      title="Pending Verification"
    >
      Pending Verification
    </span>
  );
}
