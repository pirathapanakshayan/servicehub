import { ServiceGridSkeleton } from "@/components/services/service-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading...</span>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 md:py-24">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-6 w-full max-w-xl" />
        <Skeleton className="rounded-card h-16 w-full max-w-xl" />
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-14">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="rounded-card h-36" />
          ))}
        </div>
        <Skeleton className="mt-8 h-8 w-56" />
        <ServiceGridSkeleton count={3} />
      </div>
    </div>
  );
}
