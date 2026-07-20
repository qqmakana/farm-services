export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`ru-skeleton ${className}`} aria-hidden />;
}

export function SkeletonText({
  lines = 2,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className = "" }: { className?: string }) {
  return (
    <Skeleton className={`h-12 w-12 shrink-0 rounded-full ${className}`} />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`ru-card space-y-3 p-4 ${className}`}>
      <SkeletonText lines={2} />
      <Skeleton className="h-8 w-1/3" />
    </div>
  );
}

export function SkeletonStat({ className = "" }: { className?: string }) {
  return (
    <div className={`ru-card p-4 text-center sm:text-left ${className}`}>
      <Skeleton className="mx-auto h-3 w-16 sm:mx-0" />
      <Skeleton className="mx-auto mt-2 h-8 w-20 sm:mx-0" />
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="ru-page-enter space-y-5" aria-busy aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <SkeletonText lines={1} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>
      <SkeletonRows count={4} />
    </div>
  );
}
