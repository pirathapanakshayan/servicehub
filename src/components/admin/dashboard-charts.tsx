"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const shortDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const fmtDay = (date: string) => shortDate.format(new Date(`${date}T00:00:00.000Z`));

const tick = { fontSize: 12, fill: "var(--admin-muted)" };

/** Bookings created per day: lime bars, muted grid, no axis lines (admin theme). */
export function BookingsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  return (
    <figure
      className="h-64"
      aria-label={`Bookings created per day over the last 14 days: ${total} in total`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid vertical={false} stroke="var(--admin-border)" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            tick={tick}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis allowDecimals={false} tick={tick} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "var(--admin-panel-2)" }}
            contentStyle={{
              background: "var(--admin-panel-2)",
              border: "1px solid var(--admin-border)",
              borderRadius: 14,
              color: "var(--admin-text)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--admin-text)" }}
            itemStyle={{ color: "var(--admin-text)" }}
            labelFormatter={(label) => fmtDay(String(label))}
            formatter={(value) => [value, "Bookings"]}
          />
          <Bar dataKey="count" fill="var(--admin-accent)" radius={[8, 8, 8, 8]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
