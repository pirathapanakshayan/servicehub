const block = "bg-surface-2 shimmer";

/** Placeholder shaped like <ServiceCard>, with a shimmer sweep. */
export function ServiceCardSkeleton() {
  return (
    <div className="bg-card rounded-card shadow-surface overflow-hidden" aria-hidden="true">
      <div className={`${block} aspect-[16/10] w-full`} />
      <div className="space-y-4 p-5">
        <div className={`${block} h-6 w-3/4 rounded-full`} />
        <div className="flex justify-between pt-2">
          <div className={`${block} h-5 w-28 rounded-full`} />
          <div className={`${block} h-5 w-16 rounded-full`} />
        </div>
      </div>
    </div>
  );
}

export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ServiceCardSkeleton key={i} />
      ))}
    </div>
  );
}
