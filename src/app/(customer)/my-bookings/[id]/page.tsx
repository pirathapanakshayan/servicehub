import { ArrowLeft, CalendarDays, Clock, Timer, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingTimeline } from "@/components/bookings/booking-timeline";
import { CancelBookingButton } from "@/components/bookings/cancel-booking-button";
import { StatusBadge } from "@/components/bookings/status-badge";
import { ServiceImage } from "@/components/services/service-image";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
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
  const chips = [
    { label: "Date", value: formatDate(booking.bookingDate), icon: CalendarDays },
    { label: "Time", value: formatTime(booking.bookingTime), icon: Clock },
    { label: "Duration", value: formatDuration(booking.service.durationMinutes), icon: Timer },
    { label: "Price", value: formatPrice(booking.totalPrice), icon: Wallet },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/my-bookings"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm font-medium"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to my bookings
      </Link>

      <article className="bg-card shadow-surface rounded-section overflow-hidden">
        <header className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <ServiceImage
            name=""
            imageUrl={booking.service.imageUrl}
            categorySlug={booking.service.category.slug}
            className="rounded-card aspect-square size-20 shrink-0 [&_svg]:size-8"
            sizes="80px"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={booking.status} />
              <span className="text-muted-foreground text-sm">{booking.service.category.name}</span>
            </div>
            <h1 className="text-h2 text-foreground font-medium text-balance">
              {booking.service.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              Ref{" "}
              <span className="text-foreground font-mono">
                {booking.id.slice(0, 8).toUpperCase()}
              </span>{" "}
              · Booked {formatDateTime(booking.createdAt)}
            </p>
          </div>
        </header>

        <div className="space-y-8 px-6 pb-6 sm:px-8 sm:pb-8">
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {chips.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-background rounded-inner space-y-1 p-4">
                <dt className="text-muted-foreground text-label flex items-center gap-1.5">
                  <Icon className="text-primary size-3.5" aria-hidden="true" />
                  {label}
                </dt>
                <dd className="text-foreground font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <section aria-labelledby="timeline-heading" className="space-y-4">
            <h2 id="timeline-heading" className="text-h3 text-foreground font-medium">
              Status
            </h2>
            <BookingTimeline
              status={booking.status}
              createdAt={booking.createdAt}
              updatedAt={booking.updatedAt}
            />
          </section>

          {booking.notes && (
            <section aria-labelledby="notes-heading" className="space-y-2">
              <h2 id="notes-heading" className="text-h3 text-foreground font-medium">
                Your notes
              </h2>
              <p className="bg-background text-foreground rounded-inner p-4 text-sm whitespace-pre-line">
                {booking.notes}
              </p>
            </section>
          )}

          <div className="border-border flex flex-col-reverse gap-2 border-t pt-6 sm:flex-row sm:justify-between">
            {canCustomerCancel(booking.status) ? (
              <CancelBookingButton
                bookingId={booking.id}
                serviceName={booking.service.name}
                when={when}
              />
            ) : (
              <span />
            )}
            <Link
              href={`/services/${booking.service.id}`}
              className={buttonVariants({ variant: "ghost", size: "lg" })}
            >
              View service
              <ButtonArrow />
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
