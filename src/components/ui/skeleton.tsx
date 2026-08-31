export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`vr-skeleton ${className}`} aria-hidden />;
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

export function ShopCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

export function ActivityRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-white p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-5 w-14" />
    </div>
  );
}

export function ShopListSkeleton() {
  return (
    <div className="vr-overscroll mt-3 space-y-4" aria-busy="true" aria-label="Loading shops">
      <ShopCardSkeleton />
      <ShopCardSkeleton />
      <ShopCardSkeleton />
    </div>
  );
}
