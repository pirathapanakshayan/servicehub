import type { Metadata } from "next";
import { AdminFilters } from "@/components/admin/admin-filters";
import { BookingsTable } from "@/components/admin/bookings-table";
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
  const { data: bookings, meta } = await listBookings(query, { userId: admin.id, isAdmin: true });

  const linkParams: Record<string, string> = {};
  for (const key of ["search", "status", "dateFrom", "dateTo"] as const) {
    if (query[key]) linkParams[key] = query[key];
  }

  return (
    <div className="space-y-5">
      <AdminFilters
        fields={[
          {
            type: "search",
            key: "search",
            label: "Search",
            placeholder: "Service, customer name or email...",
          },
          {
            type: "select",
            key: "status",
            label: "Status",
            options: [
              { value: "", label: "All statuses" },
              ...BOOKING_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ],
          },
          { type: "date", key: "dateFrom", label: "From" },
          { type: "date", key: "dateTo", label: "To" },
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
