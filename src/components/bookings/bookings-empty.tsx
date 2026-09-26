import { CalendarX } from "lucide-react";
import Link from "next/link";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";

export function BookingsEmpty({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="relative mb-2" aria-hidden="true">
        <span className="bg-light-text/5 absolute -inset-3 rounded-full" />
        <span className="bg-light-text text-light relative flex size-14 items-center justify-center rounded-full">
          <CalendarX className="size-6" />
        </span>
      </div>
      <h2 className="text-h3 text-light-text font-medium">{message}</h2>
      <p className="text-light-muted max-w-sm">
        Find a trusted professional and book a time that suits you.
      </p>
      <Link href="/services" className={buttonVariants({ size: "lg", className: "mt-2" })}>
        Browse services
        <ButtonArrow />
      </Link>
    </div>
  );
}
