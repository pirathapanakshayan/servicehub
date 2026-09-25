import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ServiceNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <div className="bg-primary/10 text-primary rounded-full p-3">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-ink text-xl font-semibold">Service not found</h1>
      <p className="text-muted-foreground text-sm">
        This service doesn&apos;t exist or is no longer available.
      </p>
      <Link href="/services" className={buttonVariants({ className: "mt-2 h-10" })}>
        Browse all services
      </Link>
    </div>
  );
}
