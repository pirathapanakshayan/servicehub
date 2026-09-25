import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AvatarStack, InitialsAvatar } from "@/components/admin/avatar";
import { BookingsPerDayChart } from "@/components/admin/dashboard-charts";
import { LightPanel, Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { StatusPill } from "@/components/admin/status-pill";
import { getAdminStats } from "@/lib/admin";
import { requirePageAdmin } from "@/lib/auth";
import type { BookingStatus } from "@/lib/booking-rules";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const amount = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function Lkr({ value, className }: { value: string | number; className?: string }) {
  return (
    <span className={className}>
      <span className="text-admin-muted mr-1.5 align-middle text-[0.45em] font-medium tracking-normal">
        LKR
      </span>
      {amount.format(Number(value))}
    </span>
  );
}

const panelLink = (href: string, label: string) => (
  <Link
    href={href}
    className="bg-admin-panel-2 text-admin-text hover:bg-admin-bg flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-sm whitespace-nowrap"
  >
    {label}
    <ArrowUpRight className="size-4" aria-hidden="true" />
  </Link>
);

export default async function AdminDashboardPage() {
  // Auth first: reading cookies also opts this page out of build-time prerendering.
  await requirePageAdmin();
  const stats = await getAdminStats();
  const { totals } = stats;

  const countOf = (status: BookingStatus) =>
    stats.bookingsByStatus.find((s) => s.status === status)?.count ?? 0;
  // Recent customers per status (from the 5 most recent bookings).
  const recentNames = (status: BookingStatus) =>
    [
      ...new Set(
        stats.recentBookings.filter((b) => b.status === status).map((b) => b.user?.name ?? ""),
      ),
    ].filter(Boolean);

  const statusCards: { status: BookingStatus; label: string }[] = [
    { status: "PENDING", label: "Pending bookings" },
    { status: "CONFIRMED", label: "Confirmed bookings" },
    { status: "COMPLETED", label: "Completed bookings" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Bookings overview"
          action={panelLink("/admin/bookings", "All bookings")}
          className="flex flex-col lg:col-span-2"
        >
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            {statusCards.map(({ status, label }) => {
              const count = countOf(status);
              const share = totals.bookings ? count / totals.bookings : 0;
              const names = recentNames(status);
              return (
                <StatCard
                  key={status}
                  label={label}
                  value={count}
                  subLabel={`${Math.round(share * 100)}% of ${totals.bookings} bookings`}
                  progress={share}
                  progressLabel={`${label}: ${count} of ${totals.bookings}`}
                  footer={
                    names.length > 0 ? (
                      <AvatarStack names={names} />
                    ) : (
                      <p className="text-admin-muted text-[13px]">No recent customers</p>
                    )
                  }
                />
              );
            })}
          </div>
        </Panel>

        <Panel title="Revenue from completed bookings">
          <p className="text-admin-text text-[44px] leading-none font-normal tracking-[-0.02em]">
            <Lkr value={totals.revenue} />
          </p>
          <p className="text-admin-muted mt-2 text-[13px]">
            {totals.customers} customers · {totals.activeServices} active services
          </p>

          <h3 className="text-admin-muted mt-6 mb-3 text-[13px]">Top services</h3>
          {stats.topServices.length === 0 ? (
            <p className="text-admin-muted text-sm">No bookings yet.</p>
          ) : (
            <ul className="space-y-2">
              {stats.topServices.slice(0, 3).map((service, i) => (
                <li
                  key={service.id}
                  className={cn(
                    "rounded-inner flex min-w-0 items-center gap-3 px-4 py-3",
                    i === 0
                      ? "bg-admin-accent text-admin-accent-ink"
                      : "bg-admin-panel-2 text-admin-text",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      i === 0 ? "bg-admin-accent-ink text-admin-accent" : "bg-admin-bg",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" title={service.name}>
                      {service.name}
                    </span>
                    <span className="block text-[13px]">
                      {service.bookings} {service.bookings === 1 ? "booking" : "bookings"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr_2fr]">
        <Panel
          title="Bookings per day"
          action={<span className="text-admin-muted text-[13px]">Last 14 days</span>}
        >
          {totals.bookings === 0 ? (
            <p className="text-admin-muted text-sm">No bookings yet.</p>
          ) : (
            <BookingsPerDayChart data={stats.bookingsPerDay} />
          )}
        </Panel>

        <LightPanel
          title="Recent bookings"
          action={
            <Link
              href="/admin/bookings"
              className="text-ink bg-muted hover:bg-border flex h-9 items-center gap-1 rounded-full px-3.5 text-sm"
            >
              View all
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          }
        >
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings yet.</p>
          ) : (
            <ul className="divide-border -my-2 divide-y">
              {stats.recentBookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <InitialsAvatar name={b.user?.name ?? "?"} decorative />
                  <div className="min-w-0 flex-1">
                    <p className="text-ink truncate text-sm font-medium">{b.user?.name}</p>
                    <p className="text-muted-foreground truncate text-[13px]">
                      {b.service.name} · {formatDate(b.bookingDate)}, {formatTime(b.bookingTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusPill status={b.status} />
                    <span className="text-ink text-[13px] font-medium">
                      LKR {amount.format(Number(b.totalPrice))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </LightPanel>
      </div>
    </div>
  );
}
