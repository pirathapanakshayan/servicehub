import type { BookingStatus } from "@/lib/booking-rules";
import { cn } from "@/lib/utils";

/** Status colors (text 4.5:1+ on its tint). Shared by badges and the admin status select. */
export const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-warning/15 text-amber-800 ring-warning/30",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-600/20",
  COMPLETED: "bg-green-50 text-green-700 ring-green-600/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
        STATUS_STYLES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
