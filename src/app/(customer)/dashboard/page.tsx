import { CalendarCheck, CalendarDays, CircleCheck, Clock, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/bookings/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { ServiceImage } from "@/components/services/service-image";
import { ButtonArrow, buttonVariants } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { SectionHeader } from "@/components/ui/section-header";
import { SerifAccent } from "@/components/ui/serif-accent";
import { requirePageUser } from "@/lib/auth";
import { nowInBusinessZone } from "@/lib/booking-rules";
import { getCustomerDashboard, getRecentlyBookedServices } from "@/lib/bookings";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

/** Whole days and remaining hours until a booking (both in business-zone local time). */
function countdown(date: string, time: string) {
  const now = nowInBusinessZone();
  const toMinutes = (d: string, t: string) => {
    const [y, m, day] = d.split("-").map(Number);
    const [h, min] = t.split(":").map(Number);
    return Date.UTC(y!, m! - 1, day!, h!, min!) / 60_000;
  };
  const diff = Math.max(0, toMinutes(date, time) - toMinutes(now.date, now.time));
  return { days: Math.floor(diff / 1440), hours: Math.floor((diff % 1440) / 60) };
}

export default async function DashboardPage() {
  const user = await requirePageUser("/dashboard");
  const [{ upcomingCount, completedCount, totalSpent, nextBooking }, recent] = await Promise.all([
    getCustomerDashboard(user.id),
    getRecentlyBookedServices(user.id),
  ]);
  const firstName = user.name.split(" ")[0];

  const stats = [
    { label: "Upcoming", icon: CalendarCheck, value: upcomingCount },
    { label: "Completed", icon: CircleCheck, value: completedCount },
    { label: "Total spent", icon: Wallet, value: Number(totalSpent), money: true },
  ];

  const left = nextBooking && countdown(nextBooking.bookingDate, nextBooking.bookingTime);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Dashboard"
        title={
          <>
            Welcome back, <SerifAccent>{firstName}</SerifAccent>
          </>
        }
        description="Here's what's happening with your bookings."
        actions={
          <Link href="/services" className={buttonVariants()}>
            Browse services
            <ButtonArrow />
          </Link>
        }
      />

      <section aria-label="Booking statistics" className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, icon: Icon, value, money }) => (
          <div key={label} className="bg-card shadow-surface rounded-card flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-label">{label}</p>
              <span className="bg-surface-2 text-primary flex size-9 items-center justify-center rounded-full">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="text-foreground text-[26px] leading-none font-medium tracking-tight whitespace-nowrap lg:text-[30px]">
              {money ? (
                <CountUp value={value} decimals={2} prefix="LKR " />
              ) : (
                <CountUp value={value} />
              )}
            </p>
          </div>
        ))}
      </section>

      <section aria-labelledby="next-heading" className="space-y-4">
        <h2 id="next-heading" className="text-h3 text-foreground font-medium">
          Next booking
        </h2>
        {nextBooking && left ? (
          <div className="bg-card shadow-surface rounded-section grid overflow-hidden md:grid-cols-[280px_1fr]">
            <ServiceImage
              name={nextBooking.service.name}
              imageUrl={nextBooking.service.imageUrl}
              categorySlug={nextBooking.service.category.slug}
              className="h-full min-h-44 md:aspect-auto"
              sizes="(min-width: 768px) 280px, 100vw"
            />
            <div className="flex flex-col gap-5 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={nextBooking.status} />
                <span className="text-muted-foreground text-sm">
                  {nextBooking.service.category.name}
                </span>
              </div>
              <p className="text-h2 text-foreground font-medium">{nextBooking.service.name}</p>
              <ul className="flex flex-wrap gap-2" aria-label="Time until booking">
                {[
                  { n: left.days, unit: left.days === 1 ? "day" : "days" },
                  { n: left.hours, unit: left.hours === 1 ? "hour" : "hours" },
                ].map(({ n, unit }) => (
                  <li
                    key={unit}
                    className="bg-primary text-primary-foreground flex items-baseline gap-1.5 rounded-full px-4 py-2"
                  >
                    <span className="text-xl font-semibold tabular-nums">{n}</span>
                    <span className="text-sm">{unit}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden="true" />
                  {formatDate(nextBooking.bookingDate)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" aria-hidden="true" />
                  {formatTime(nextBooking.bookingTime)}
                </span>
                <span className="text-foreground font-medium">
                  {formatPrice(nextBooking.totalPrice)}
                </span>
              </p>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link
                  href={`/my-bookings/${nextBooking.id}`}
                  className={buttonVariants({ size: "lg" })}
                >
                  View booking
                  <ButtonArrow />
                </Link>
                <Link
                  href="/my-bookings"
                  className={buttonVariants({ variant: "ghost", size: "lg" })}
                >
                  All bookings
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card shadow-surface rounded-section flex flex-col items-start gap-4 p-8">
            <p className="text-foreground text-h3 font-medium">Nothing booked yet</p>
            <p className="text-muted-foreground">Find a service and pick a time that suits you.</p>
            <Link href="/services" className={buttonVariants({ size: "lg" })}>
              Browse services
              <ButtonArrow />
            </Link>
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="again-heading" className="space-y-5">
          <SectionHeader id="again-heading" title="Book again" className="[&_h2]:text-h3" />
          <ul className="-mx-4 flex snap-x [scrollbar-width:none] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
            {recent.map((service) => (
              <li key={service.id} className="w-64 shrink-0 snap-start sm:w-auto">
                <Link
                  href={`/services/${service.id}`}
                  className="group bg-card shadow-surface rounded-card block overflow-hidden transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none"
                >
                  <ServiceImage
                    name={service.name}
                    imageUrl={service.imageUrl}
                    categorySlug={service.category.slug}
                    sizes="(min-width: 1024px) 280px, 256px"
                  />
                  <span className="block space-y-1 p-4">
                    <span className="text-foreground block truncate font-medium">
                      {service.name}
                    </span>
                    <span className="text-muted-foreground flex justify-between text-sm">
                      {formatPrice(service.price)}
                      <span>{formatDuration(service.durationMinutes)}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
