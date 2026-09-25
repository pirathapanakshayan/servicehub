import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading dashboard...</span>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="rounded-card h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Skeleton className="rounded-card h-80" />
        <Skeleton className="rounded-card h-80" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Skeleton className="rounded-card h-72" />
        <Skeleton className="rounded-card h-72" />
      </div>
    </div>
  );
}
