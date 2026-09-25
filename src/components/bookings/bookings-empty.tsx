import { CalendarX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function BookingsEmpty({ message }: { message: string }) {
  return (
    <div className="border-border bg-card rounded-card flex flex-col items-center gap-3 border border-dashed px-6 py-16 text-center">
      <div className="bg-primary/10 text-primary rounded-full p-3">
        <CalendarX className="size-6" aria-hidden="true" />
      </div>
      <h2 className="text-ink text-lg font-semibold">{message}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        Find a trusted professional and book a time that suits you.
      </p>
      <Link href="/services" className={buttonVariants({ className: "mt-2 h-10" })}>
        Browse services
      </Link>
    </div>
  );
}
