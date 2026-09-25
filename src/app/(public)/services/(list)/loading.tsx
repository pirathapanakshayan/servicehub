import { ServiceGridSkeleton } from "@/components/services/service-card-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServicesLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10" aria-busy="true">
      <span className="sr-only">Loading services...</span>
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-80 max-w-full" />
      </div>
      <Skeleton className="rounded-card h-40 w-full sm:h-36 lg:h-[82px]" />
      <Skeleton className="h-4 w-44" />
      <ServiceGridSkeleton count={9} />
    </div>
  );
}
