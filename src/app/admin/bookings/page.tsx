import type { Metadata } from "next";
import { BookingsTable } from "@/components/admin/bookings-table";
import { FilterBar } from "@/components/admin/filter-bar";
import { PillTabs, tabHref } from "@/components/admin/pill-tabs";
import { STATUS_LABELS } from "@/components/bookings/status-badge";
import { Pagination } from "@/components/services/pagination";
import { requirePageAdmin } from "@/lib/auth";
import { BOOKING_STATUSES } from "@/lib/booking-rules";
import { listBookings } from "@/lib/bookings";
import { bookingQuerySchema, parseSearchParams } from "@/lib/validators";

export const metadata: Metadata = { title: "Bookings" };

type AdminBookingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const admin = await requirePageAdmin();
  const query = parseSearchParams(bookingQuerySchema, await searchParams);
  const viewer = { userId: admin.id, isAdmin: true };
  // Tab counts ignore the status filter so each tab shows its own total.
  const countQuery = { ...query, status: undefined, page: 1, limit: 1 };
  const [{ data: bookings, meta }, all, ...byStatus] = await Promise.all([
    listBookings(query, viewer),
    listBookings(countQuery, viewer),
    ...BOOKING_STATUSES.map((status) => listBookings({ ...countQuery, status }, viewer)),
  ]);

  const linkParams: Record<string, string> = {};
  for (const key of ["search", "status", "dateFrom", "dateTo"] as const) {
    if (query[key]) linkParams[key] = query[key];
  }
  const tabs = [
    {
      label: "All",
      count: all.meta.total,
      href: tabHref("/admin/bookings", linkParams, "status"),
      active: !query.status,
    },
    ...BOOKING_STATUSES.map((status, i) => ({
      label: STATUS_LABELS[status],
      count: byStatus[i]!.meta.total,
      href: tabHref("/admin/bookings", linkParams, "status", status),
      active: query.status === status,
    })),
  ];

  return (
    <div className="space-y-5">
      <PillTabs label="Booking status" tabs={tabs} />
      <FilterBar
        preserve={["status"]}
        fields={[
          {
            type: "search",
            key: "search",
            label: "Search bookings",
            placeholder: "Service, customer name or email...",
          },
          { type: "date", key: "dateFrom", label: "From date" },
          { type: "date", key: "dateTo", label: "To date" },
        ]}
      />
      <BookingsTable
        bookings={bookings}
        hasFilters={Object.keys(linkParams).length > 0}
        total={meta.total}
      />
      <Pagination
        page={meta.page}
        totalPages={Math.max(1, Math.ceil(meta.total / meta.limit))}
        params={linkParams}
        basePath="/admin/bookings"
      />
    </div>
  );
}
