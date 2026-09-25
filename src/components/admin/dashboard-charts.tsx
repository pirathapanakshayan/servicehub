"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { STATUS_LABELS } from "@/components/bookings/status-badge";
import type { BookingStatus } from "@/lib/booking-rules";

/** Status colors follow the badge palette via chart tokens (see globals.css). */
const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "var(--chart-2)",
  CONFIRMED: "var(--chart-3)",
  COMPLETED: "var(--chart-1)",
  CANCELLED: "var(--chart-5)",
};

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fmtDay = (date: string) => shortDate.format(new Date(`${date}T00:00:00.000Z`));

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid var(--border)",
  fontSize: 12,
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.06)",
};

export function BookingsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <figure
      className="h-64"
      aria-label={`Bookings created per day, last 14 days: ${total} in total`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={12}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={tooltipStyle}
            labelFormatter={(label) => fmtDay(String(label))}
            formatter={(value) => [value, "Bookings"]}
          />
          <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}

export function BookingsByStatusChart({
  data,
}: {
  data: { status: BookingStatus; count: number }[];
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const slices = data.filter((d) => d.count > 0);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col 2xl:flex-row">
      <figure
        className="relative h-48 w-48 shrink-0"
        aria-label={`Bookings by status, ${total} total`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="count"
              nameKey="status"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="none"
            >
              {slices.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [value, STATUS_LABELS[name as BookingStatus]]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-ink text-2xl font-bold">{total}</span>
          <span className="text-muted-foreground text-xs">bookings</span>
        </div>
      </figure>
      <ul className="w-full min-w-0 space-y-2 text-sm">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[d.status] }}
                aria-hidden="true"
              />
              {STATUS_LABELS[d.status]}
            </span>
            <span className="text-ink font-semibold">
              {d.count}
              <span className="text-muted-foreground ml-1 font-normal">
                ({total ? Math.round((d.count / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
