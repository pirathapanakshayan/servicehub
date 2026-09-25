import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/bookings/status-badge";
import { CategoryIcon } from "@/components/services/category-icon";
import type { BookingDTO } from "@/lib/bookings";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export function BookingCard({ booking }: { booking: BookingDTO }) {
  return (
    <Link
      href={`/my-bookings/${booking.id}`}
      className="bg-card border-border rounded-card hover:border-primary group flex items-center gap-4 border p-4 transition-colors"
    >
      <span className="bg-primary/10 text-primary hidden size-12 shrink-0 items-center justify-center rounded-full sm:flex">
        <CategoryIcon slug={booking.service.category.slug} className="size-5" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-ink truncate font-semibold">{booking.service.name}</h2>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-4" aria-hidden="true" />
            {formatDate(booking.bookingDate)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden="true" />
            {formatTime(booking.bookingTime)}
          </span>
        </p>
      </div>
      <span className="text-ink hidden font-semibold whitespace-nowrap sm:block">
        {formatPrice(booking.totalPrice)}
      </span>
      <ChevronRight
        className="text-muted-foreground group-hover:text-primary size-5 shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}
