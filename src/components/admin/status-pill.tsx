import { STATUS_LABELS } from "@/components/bookings/status-badge";
import type { BookingStatus } from "@/lib/booking-rules";
import { cn } from "@/lib/utils";

export const STATUS_VAR: Record<BookingStatus, string> = {
  PENDING: "var(--status-pending)",
  CONFIRMED: "var(--status-confirmed)",
  COMPLETED: "var(--status-completed)",
  CANCELLED: "var(--status-cancelled)",
};

/**
 * Outlined status pill. On dark panels the text uses the status color; inside a LightPanel
 * (.admin-light) the text turns dark and the color stays on the dot and border (globals.css).
 */
export function StatusPill({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        "status-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className,
      )}
      style={{ "--pill": STATUS_VAR[status] } as React.CSSProperties}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: "var(--pill)" }}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Active/inactive pill for customers, using the same outlined style. */
export function ActivePill({ active }: { active: boolean }) {
  return (
    <span
      className="status-pill inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={
        {
          "--pill": active ? "var(--status-completed)" : "var(--status-cancelled)",
        } as React.CSSProperties
      }
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: "var(--pill)" }}
        aria-hidden="true"
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
