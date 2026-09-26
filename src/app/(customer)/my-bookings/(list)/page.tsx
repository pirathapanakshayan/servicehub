import type { Metadata } from "next";
import { BookingCard } from "@/components/bookings/booking-card";
import { BookingsEmpty } from "@/components/bookings/bookings-empty";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/services/pagination";
import { LightPanel } from "@/components/ui/light-panel";
import { PillTabs } from "@/components/ui/pill-tabs";
import { requirePageUser } from "@/lib/auth";
import {
  BOOKING_TABS,
  getCustomerTabCounts,
  listCustomerBookings,
  type BookingTab,
} from "@/lib/bookings";
import { tabHref } from "@/lib/url";

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
  const [{ data: bookings, meta }, counts] = await Promise.all([
    listCustomerBookings(user.id, tab, page),
    getCustomerTabCounts(user.id),
  ]);
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.limit));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bookings"
        title="My bookings"
        description="Track, review and manage your service bookings."
      />

      <PillTabs
        label="Booking filters"
        tabs={BOOKING_TABS.map((t) => ({
          label: TAB_LABELS[t],
          href: tabHref("/my-bookings", {}, "tab", t === "all" ? undefined : t),
          count: counts[t],
          active: t === tab,
        }))}
      />

      {bookings.length === 0 ? (
        <LightPanel>
          <BookingsEmpty message={EMPTY_MESSAGES[tab]} />
        </LightPanel>
      ) : (
        <>
          <LightPanel className="p-2 sm:p-3">
            <ul className="divide-border divide-y">
              {bookings.map((booking) => (
                <li key={booking.id}>
                  <BookingCard booking={booking} />
                </li>
              ))}
            </ul>
          </LightPanel>
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
