import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function ServicesEmpty() {
  return (
    <div className="border-border bg-card rounded-card flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center">
      <div className="bg-primary/10 text-primary rounded-full p-3">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-ink text-lg font-semibold">No services match your filters</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Try a different search term, widen your price range or pick another category.
      </p>
      <Link href="/services" className={buttonVariants({ className: "mt-2 h-10" })}>
        Clear filters
      </Link>
    </div>
  );
}
