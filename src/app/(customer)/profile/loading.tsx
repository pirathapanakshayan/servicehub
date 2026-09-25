import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <span className="sr-only">Loading profile...</span>
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-56" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="rounded-card h-96" />
        <Skeleton className="rounded-card h-96" />
      </div>
    </div>
  );
}
