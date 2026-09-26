import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function ServicesEmpty() {
  return (
    <div className="bg-card rounded-section shadow-surface flex flex-col items-center gap-4 px-6 py-20 text-center">
      <div className="relative mb-2" aria-hidden="true">
        <span className="bg-primary/10 absolute -inset-5 rounded-full" />
        <span className="bg-primary/10 absolute -inset-2.5 rounded-full" />
        <span className="bg-surface-2 text-primary relative flex size-16 items-center justify-center rounded-full">
          <SearchX className="size-7" />
        </span>
      </div>
      <h2 className="text-h3 text-foreground font-medium">No services match your filters</h2>
      <p className="text-muted-foreground max-w-sm">
        Try a different search term, widen your price range or pick another category.
      </p>
      <Link href="/services" className={buttonVariants({ className: "mt-2" })}>
        Clear filters
      </Link>
    </div>
  );
}
