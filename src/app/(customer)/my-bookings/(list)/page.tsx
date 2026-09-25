import type { Metadata } from "next";
import Link from "next/link";
import { BookingCard } from "@/components/bookings/booking-card";
import { BookingsEmpty } from "@/components/bookings/bookings-empty";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/services/pagination";
import { requirePageUser } from "@/lib/auth";
import { BOOKING_TABS, listCustomerBookings, type BookingTab } from "@/lib/bookings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My bookings" };

const TAB_LABELS: Record<BookingTab, string> = {
  all: "All",
  upcoming: "Upcoming",
  past: "Past",
  cancelled: "Cancelled",
};

const EMPTY_MESSAGES: Record<BookingTab, string> = {
  all: "You haven't made any bookings yet",
  upcoming: "You have no upcoming bookings",
  past: "You have no past bookings",
  cancelled: "You have no cancelled bookings",
};

type MyBookingsPageProps = {
  searchParams: Promise<{ tab?: string | string[]; page?: string | string[] }>;
};

export default async function MyBookingsPage({ searchParams }: MyBookingsPageProps) {
  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab: BookingTab = BOOKING_TABS.includes(rawTab as BookingTab)
    ? (rawTab as BookingTab)
    : "all";
  const rawPage = Number(Array.isArray(params.page) ? params.page[0] : params.page);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const user = await requirePageUser("/my-bookings");
  const { data: bookings, meta } = await listCustomerBookings(user.id, tab, page);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My bookings"
        description="Track, review and manage your service bookings."
      />

      <nav
        aria-label="Booking filters"
        className="border-border flex gap-1 overflow-x-auto border-b"
      >
        {BOOKING_TABS.map((t) => (
          <Link
            key={t}
            href={t === "all" ? "/my-bookings" : `/my-bookings?tab=${t}`}
            aria-current={t === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
              t === tab
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-ink border-transparent",
            )}
          >
            {TAB_LABELS[t]}
          </Link>
        ))}
      </nav>

      {bookings.length === 0 ? (
        <BookingsEmpty message={EMPTY_MESSAGES[tab]} />
      ) : (
        <>
          <ul className="space-y-3">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <BookingCard booking={booking} />
              </li>
            ))}
          </ul>
          <Pagination
            page={meta.page}
            totalPages={totalPages}
            params={tab === "all" ? {} : { tab }}
            basePath="/my-bookings"
          />
        </>
      )}
    </div>
  );
}
