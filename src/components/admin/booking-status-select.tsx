"use client";

import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { STATUS_VAR } from "@/components/ui/status-pill";
import { STATUS_LABELS } from "@/components/bookings/status-badge";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { nextStatuses, type BookingStatus } from "@/lib/booking-rules";
import { cn } from "@/lib/utils";

type BookingStatusSelectProps = {
  bookingId: string;
  status: BookingStatus;
  /** Shown in the cancel confirmation, e.g. "Deep Kitchen Cleaning for Nimali Perera". */
  summary: string;
};

/** Status dropdown offering only transitions an admin may make (see booking-rules.ts). */
export function BookingStatusSelect({ bookingId, status, summary }: BookingStatusSelectProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const options = nextStatuses(status, "ADMIN");

  const update = async (next: BookingStatus) => {
    setPending(true);
    try {
      await apiFetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        body: JSON.stringify({ status: next }),
      });
      toast.success(`Booking marked ${STATUS_LABELS[next].toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update booking");
      throw error;
    } finally {
      setPending(false);
    }
  };

  return (
    // Stop clicks reaching the table row, which opens the details sheet.
    <div
      className="relative inline-flex items-center"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <select
        aria-label={`Status: ${STATUS_LABELS[status]}. Change status`}
        value={status}
        disabled={pending || options.length === 0}
        onChange={(e) => {
          const next = e.target.value as BookingStatus;
          if (next === "CANCELLED") setConfirmCancel(true);
          else update(next).catch(() => undefined);
        }}
        // Outlined status pill (see .status-pill in globals.css): colored text on dark
        // surfaces, dark text with a colored border inside white panels.
        style={{ "--pill": STATUS_VAR[status] } as React.CSSProperties}
        className={cn(
          "status-pill h-8 rounded-full border bg-transparent pr-7 pl-3 text-xs font-medium disabled:cursor-default disabled:opacity-100",
          options.length === 0 && "appearance-none pr-3",
        )}
      >
        <option value={status}>{STATUS_LABELS[status]}</option>
        {options.map((s) => (
          <option key={s} value={s}>
            {s === "CANCELLED" ? "Cancel booking" : `Mark ${STATUS_LABELS[s].toLowerCase()}`}
          </option>
        ))}
      </select>
      {pending && (
        <LoaderCircle
          className="text-muted-foreground absolute -right-5 size-3.5 animate-spin"
          aria-label="Updating"
        />
      )}
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this booking?"
        description={`${summary} will be cancelled. Cancelled bookings are final and the time slot is released.`}
        confirmLabel="Cancel booking"
        pendingLabel="Cancelling..."
        destructive
        onConfirm={() => update("CANCELLED")}
      />
    </div>
  );
}
