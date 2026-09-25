import { ArrowRight, CalendarCheck, CalendarDays, CircleCheck, Clock, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/bookings/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth";
import { nowInBusinessZone } from "@/lib/booking-rules";
import { getCustomerDashboard } from "@/lib/bookings";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(): string {
  const hour = Number(nowInBusinessZone().time.slice(0, 2));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user = await requirePageUser("/dashboard");
  const { upcomingCount, completedCount, totalSpent, nextBooking } = await getCustomerDashboard(
    user.id,
  );
  const firstName = user.name.split(" ")[0];

  const stats = [
    { label: "Upcoming bookings", value: String(upcomingCount), icon: CalendarCheck },
    { label: "Completed", value: String(completedCount), icon: CircleCheck },
    { label: "Total spent", value: formatPrice(totalSpent), icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        description="Here's what's happening with your bookings."
        actions={
          <Link href="/services" className={buttonVariants()}>
            Browse services
            <ArrowRight aria-hidden="true" />
          </Link>
        }
      />

      <section aria-label="Booking statistics" className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border-border rounded-card border p-5">
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              {label}
              <span className="bg-primary/10 text-primary rounded-full p-2">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-ink mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="next-heading" className="space-y-3">
        <h2 id="next-heading" className="text-ink text-lg font-semibold">
          Next upcoming booking
        </h2>
        {nextBooking ? (
          <div className="bg-card border-border rounded-card flex flex-col gap-4 border p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-ink text-lg font-semibold">{nextBooking.service.name}</p>
                <StatusBadge status={nextBooking.status} />
              </div>
              <p className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(nextBooking.bookingDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {formatTime(nextBooking.bookingTime)}
                </span>
                <span className="text-ink font-medium">{formatPrice(nextBooking.totalPrice)}</span>
              </p>
            </div>
            <Link
              href={`/my-bookings/${nextBooking.id}`}
              className={buttonVariants({ variant: "outline", className: "h-10" })}
            >
              View booking
            </Link>
          </div>
        ) : (
          <div className="border-border bg-card rounded-card flex flex-col items-start gap-3 border border-dashed p-6">
            <p className="text-muted-foreground text-sm">
              You have no upcoming bookings. Find a service and pick a time that suits you.
            </p>
            <Link href="/services" className={buttonVariants({ className: "h-10" })}>
              Browse services
            </Link>
          </div>
        )}
      </section>

      <Link
        href="/my-bookings"
        className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
      >
        View all my bookings
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
