import { ArrowRight, CalendarCheck, Sparkles, Users, Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { TableShell, rowClass, tdClass, thClass } from "@/components/admin/admin-table";
import { BookingsByStatusChart, BookingsPerDayChart } from "@/components/admin/dashboard-charts";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/bookings/status-badge";
import { getAdminStats } from "@/lib/admin";
import { requirePageAdmin } from "@/lib/auth";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    // min-w-0 lets wide tables scroll inside the grid cell instead of stretching the column.
    <section className="bg-card border-border rounded-card min-w-0 border p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-ink font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const viewAll = (href: string) => (
  <Link
    href={href}
    className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
  >
    View all
    <ArrowRight className="size-4" aria-hidden="true" />
  </Link>
);

export default async function AdminDashboardPage() {
  // Auth first: reading cookies also opts this page out of build-time prerendering.
  await requirePageAdmin();
  const stats = await getAdminStats();
  const { totals } = stats;
  const maxTop = Math.max(1, ...stats.topServices.map((s) => s.bookings));

  return (
    <div className="space-y-6">
      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Customers" value={String(totals.customers)} icon={Users} />
        <StatCard label="Active services" value={String(totals.activeServices)} icon={Sparkles} />
        <StatCard label="Total bookings" value={String(totals.bookings)} icon={CalendarCheck} />
        <StatCard
          label="Revenue"
          value={formatPrice(totals.revenue)}
          icon={Wallet}
          hint="From completed bookings"
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Bookings per day (last 14 days)">
          <BookingsPerDayChart data={stats.bookingsPerDay} />
        </Panel>
        <Panel title="Bookings by status">
          {totals.bookings === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings yet.</p>
          ) : (
            <BookingsByStatusChart data={stats.bookingsByStatus} />
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Panel title="Top services" action={viewAll("/admin/services")}>
          {stats.topServices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings yet.</p>
          ) : (
            <ol className="space-y-4">
              {stats.topServices.map((s, i) => (
                <li key={s.id} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-ink min-w-0 truncate font-medium">
                      <span className="text-muted-foreground mr-2">{i + 1}.</span>
                      {s.name}
                    </span>
                    <span className="text-muted-foreground shrink-0">
                      {s.bookings} {s.bookings === 1 ? "booking" : "bookings"}
                    </span>
                  </div>
                  <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{ width: `${(s.bookings / maxTop) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Recent bookings" action={viewAll("/admin/bookings")}>
          {stats.recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings yet.</p>
          ) : (
            <TableShell label="Recent bookings" minWidth="sm">
              <thead>
                <tr>
                  <th className={thClass}>Customer</th>
                  <th className={thClass}>Service</th>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Amount</th>
                  <th className={thClass}>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentBookings.map((b) => (
                  <tr key={b.id} className={rowClass(false)}>
                    <td className={tdClass}>
                      <p className="text-ink font-medium">{b.user?.name}</p>
                      <p className="text-muted-foreground text-xs">{b.user?.email}</p>
                    </td>
                    <td className={tdClass}>{b.service.name}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {formatDate(b.bookingDate)}
                      <span className="text-muted-foreground block text-xs">
                        {formatTime(b.bookingTime)}
                      </span>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{formatPrice(b.totalPrice)}</td>
                    <td className={tdClass}>
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          )}
        </Panel>
      </div>
    </div>
  );
}
