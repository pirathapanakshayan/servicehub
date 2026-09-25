"use client";

import { Mail, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminEmpty, TableShell, rowClass, tdClass, thClass } from "@/components/admin/admin-table";
import { BookingStatusSelect } from "@/components/admin/booking-status-select";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { BookingTimeline } from "@/components/bookings/booking-timeline";
import { StatusBadge } from "@/components/bookings/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { BookingDTO } from "@/lib/bookings";
import { formatDate, formatDateTime, formatDuration, formatPrice, formatTime } from "@/lib/format";

type BookingsTableProps = { bookings: BookingDTO[]; hasFilters: boolean; total: number };

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-ink text-sm font-medium">{children}</dd>
    </div>
  );
}

export function BookingsTable({ bookings, hasFilters, total }: BookingsTableProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Look up by id so the sheet reflects fresh data after router.refresh().
  const selected = bookings.find((b) => b.id === selectedId) ?? null;

  const deleteBooking = async () => {
    if (!selected) return;
    try {
      await apiFetch(`/api/bookings/${selected.id}`, { method: "DELETE" });
      toast.success("Booking deleted");
      setSelectedId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to delete booking");
      throw error;
    }
  };

  if (bookings.length === 0) {
    return (
      <AdminEmpty
        title={hasFilters ? "No bookings match your filters" : "No bookings yet"}
        description={
          hasFilters
            ? "Try a different search, status or date range."
            : "Bookings will appear here as soon as customers make them."
        }
      />
    );
  }

  return (
    <>
      <p className="text-muted-foreground text-sm">
        {total} {total === 1 ? "booking" : "bookings"}
      </p>
      <TableShell label="Bookings">
        <thead>
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Service</th>
            <th className={thClass}>Date</th>
            <th className={thClass}>Time</th>
            <th className={thClass}>Amount</th>
            <th className={thClass}>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr
              key={b.id}
              className={rowClass(true)}
              tabIndex={0}
              aria-label={`View booking: ${b.service.name} for ${b.user?.name}`}
              onClick={() => setSelectedId(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(b.id);
                }
              }}
            >
              <td className={tdClass}>
                <p className="text-ink font-medium">{b.user?.name}</p>
                <p className="text-muted-foreground text-xs">{b.user?.email}</p>
              </td>
              <td className={`${tdClass} max-w-56`}>
                <span className="line-clamp-2">{b.service.name}</span>
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>{formatDate(b.bookingDate)}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{formatTime(b.bookingTime)}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{formatPrice(b.totalPrice)}</td>
              <td className={tdClass}>
                <BookingStatusSelect
                  bookingId={b.id}
                  status={b.status}
                  summary={`${b.service.name} for ${b.user?.name}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-border border-b pr-12">
                <SheetTitle className="text-lg">{selected.service.name}</SheetTitle>
                <SheetDescription>
                  Ref {selected.id.slice(0, 8).toUpperCase()} · booked{" "}
                  {formatDateTime(selected.createdAt)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge status={selected.status} />
                  <BookingStatusSelect
                    bookingId={selected.id}
                    status={selected.status}
                    summary={`${selected.service.name} for ${selected.user?.name}`}
                  />
                </div>

                <section className="space-y-2">
                  <h3 className="text-ink text-sm font-semibold">Customer</h3>
                  <p className="text-ink font-medium">{selected.user?.name}</p>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Mail className="size-4" aria-hidden="true" />
                    <a href={`mailto:${selected.user?.email}`} className="hover:text-ink">
                      {selected.user?.email}
                    </a>
                  </p>
                  {selected.user?.phone && (
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Phone className="size-4" aria-hidden="true" />
                      <a href={`tel:${selected.user.phone}`} className="hover:text-ink">
                        {selected.user.phone}
                      </a>
                    </p>
                  )}
                </section>

                <dl className="grid grid-cols-2 gap-4">
                  <Detail label="Date">{formatDate(selected.bookingDate)}</Detail>
                  <Detail label="Time">{formatTime(selected.bookingTime)}</Detail>
                  <Detail label="Duration">
                    {formatDuration(selected.service.durationMinutes)}
                  </Detail>
                  <Detail label="Category">{selected.service.category.name}</Detail>
                  <Detail label="Total price">{formatPrice(selected.totalPrice)}</Detail>
                  <Detail label="Current list price">{formatPrice(selected.service.price)}</Detail>
                </dl>

                {selected.notes && (
                  <section className="space-y-1">
                    <h3 className="text-ink text-sm font-semibold">Customer notes</h3>
                    <p className="text-ink bg-background border-border rounded-control border p-3 text-sm whitespace-pre-line">
                      {selected.notes}
                    </p>
                  </section>
                )}

                <section className="space-y-3">
                  <h3 className="text-ink text-sm font-semibold">Status history</h3>
                  <BookingTimeline
                    status={selected.status}
                    createdAt={selected.createdAt}
                    updatedAt={selected.updatedAt}
                  />
                </section>

                <Button
                  variant="destructive"
                  className="h-10 w-full"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 aria-hidden="true" />
                  Delete booking
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this booking?"
        description="The booking will be permanently removed. To keep a record, cancel it instead."
        confirmLabel="Delete booking"
        pendingLabel="Deleting..."
        destructive
        onConfirm={deleteBooking}
      />
    </>
  );
}
