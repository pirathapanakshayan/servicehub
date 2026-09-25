import { Skeleton } from "@/components/ui/skeleton";

export default function MyBookingsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading bookings...</span>
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="rounded-card h-20" />
        ))}
      </div>
    </div>
  );
}
