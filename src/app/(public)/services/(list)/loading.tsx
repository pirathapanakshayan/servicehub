import { ServiceGridSkeleton } from "@/components/services/service-card-skeleton";

const block = "bg-surface-2 shimmer rounded-full";

export default function ServicesLoading() {
  return (
    <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-10" aria-busy="true">
      <span className="sr-only">Loading services...</span>
      <div className="space-y-3">
        <div className={`${block} h-4 w-24`} />
        <div className={`${block} h-9 w-64`} />
        <div className={`${block} h-5 w-48`} />
      </div>
      <div className={`${block} h-11 w-full`} />
      <div className={`${block} h-11 w-80 max-w-full`} />
      <ServiceGridSkeleton count={9} />
    </div>
  );
}
