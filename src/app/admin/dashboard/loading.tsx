import { Skeleton } from "@/components/ui/skeleton";

/** Dashboard skeleton in panel colors: overview + revenue, then chart + recent list. */
export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading dashboard...</span>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="bg-admin-panel rounded-panel space-y-5 p-6 lg:col-span-2">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="bg-admin-bg rounded-inner h-44" />
            ))}
          </div>
        </div>
        <div className="bg-admin-panel rounded-panel space-y-4 p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-11 w-44" />
          <div className="grid grid-cols-3 gap-2 pt-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="rounded-inner h-28" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <div className="bg-admin-panel rounded-panel space-y-4 p-6">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="admin-light bg-admin-light rounded-panel space-y-4 p-6">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
