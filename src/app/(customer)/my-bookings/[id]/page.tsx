import { ArrowLeft, CalendarDays, Clock, Tag, Timer } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingTimeline } from "@/components/bookings/booking-timeline";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { StatusBadge } from "@/components/bookings/status-badge";
import { requirePageUser } from "@/lib/auth";
import { canCustomerCancel } from "@/lib/booking-rules";
import { getBookingForViewer } from "@/lib/bookings";
import { formatDate, formatDateTime, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { uuidParamSchema } from "@/lib/validators";

export const metadata: Metadata = { title: "Booking details" };

type BookingDetailPageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const user = await requirePageUser(`/my-bookings/${id}`);

  const parsedId = uuidParamSchema.safeParse(id);
  if (!parsedId.success) notFound();
  // Scoped to the current user: other people's bookings are "not found".
  const booking = await getBookingForViewer(parsedId.data, { userId: user.id, isAdmin: false });
  if (!booking) notFound();

  const when = `${formatDate(booking.bookingDate)} at ${formatTime(booking.bookingTime)}`;
  const details = [
    { label: "Date", value: formatDate(booking.bookingDate), icon: CalendarDays },
    { label: "Time", value: formatTime(booking.bookingTime), icon: Clock },
    { label: "Duration", value: formatDuration(booking.service.durationMinutes), icon: Timer },
    { label: "Category", value: booking.service.category.name, icon: Tag },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/my-bookings"
        className="text-muted-foreground hover:text-ink inline-flex items-center gap-1 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to my bookings
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <StatusBadge status={booking.status} />
          <h1 className="text-ink text-3xl font-bold">{booking.service.name}</h1>
          <p className="text-muted-foreground text-sm">
            Booking reference{" "}
            <span className="text-ink font-mono">{booking.id.slice(0, 8).toUpperCase()}</span> ·
            Booked {formatDateTime(booking.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section
            aria-labelledby="details-heading"
            className="bg-card border-border rounded-card border p-6"
          >
            <h2 id="details-heading" className="text-ink mb-4 font-semibold">
              Booking details
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {details.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="bg-primary/10 text-primary rounded-full p-2">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-ink font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {booking.notes && (
              <div className="border-border mt-6 border-t pt-4">
                <h3 className="text-muted-foreground mb-1 text-xs">Your notes</h3>
                <p className="text-ink text-sm whitespace-pre-line">{booking.notes}</p>
              </div>
            )}
          </section>

          <section
            aria-labelledby="timeline-heading"
            className="bg-card border-border rounded-card border p-6"
          >
            <h2 id="timeline-heading" className="text-ink mb-4 font-semibold">
              Status
            </h2>
            <BookingTimeline
              status={booking.status}
              createdAt={booking.createdAt}
              updatedAt={booking.updatedAt}
            />
          </section>
        </div>

        <aside className="bg-card border-border rounded-card h-fit space-y-4 border p-6">
          <div>
            <p className="text-muted-foreground text-sm">Total price</p>
            <p className="text-ink text-2xl font-bold">{formatPrice(booking.totalPrice)}</p>
            <p className="text-muted-foreground text-xs">Price locked in when you booked.</p>
          </div>
          <Link
            href={`/services/${booking.service.id}`}
            className="text-primary block text-sm font-semibold hover:underline"
          >
            View service
          </Link>
          {canCustomerCancel(booking.status) && (
            <CancelBookingButton
              bookingId={booking.id}
              serviceName={booking.service.name}
              when={when}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
