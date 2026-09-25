import { SearchX } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function BookingNotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <div className="bg-primary/10 text-primary rounded-full p-3">
        <SearchX className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-ink text-xl font-semibold">Booking not found</h1>
      <p className="text-muted-foreground text-sm">
        This booking doesn&apos;t exist or doesn&apos;t belong to your account.
      </p>
      <Link href="/my-bookings" className={buttonVariants({ className: "mt-2 h-10" })}>
        Back to my bookings
      </Link>
    </div>
  );
}
