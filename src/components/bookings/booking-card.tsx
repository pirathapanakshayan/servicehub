import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/bookings/status-badge";
import { ServiceImage } from "@/components/services/service-image";
import type { BookingDTO } from "@/lib/bookings";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

/** One booking row for the white My Bookings panel. */
export function BookingCard({ booking }: { booking: BookingDTO }) {
  return (
    <Link
      href={`/my-bookings/${booking.id}`}
      className="group hover:bg-light-text/5 rounded-inner flex items-center gap-4 p-3 transition-colors sm:p-4"
    >
      <ServiceImage
        name=""
        imageUrl={booking.service.imageUrl}
        categorySlug={booking.service.category.slug}
        className="rounded-inner bg-light-text/5 [&>div]:text-light-text aspect-square size-14 shrink-0 sm:size-16 [&_svg]:size-6"
        sizes="64px"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-light-text truncate font-medium">{booking.service.name}</h2>
          <StatusBadge status={booking.status} />
        </div>
        <p className="text-light-muted flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
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
      <span className="text-light-text hidden font-semibold whitespace-nowrap sm:block">
        {formatPrice(booking.totalPrice)}
      </span>
      <ChevronRight
        className="text-light-muted size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
    </Link>
  );
}
