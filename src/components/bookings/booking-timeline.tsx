import { Check, CircleX } from "lucide-react";
import type { BookingStatus } from "@/lib/booking-rules";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Step = {
  label: string;
  description: string;
  state: "done" | "current" | "todo" | "cancelled";
  at?: string;
};

const ORDER: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

const STEPS: Record<"PENDING" | "CONFIRMED" | "COMPLETED", { label: string; description: string }> =
  {
    PENDING: { label: "Pending", description: "Your request was received." },
    CONFIRMED: { label: "Confirmed", description: "The provider accepted your booking." },
    COMPLETED: { label: "Completed", description: "The service has been delivered." },
  };

function buildSteps(status: BookingStatus, createdAt: string, updatedAt: string): Step[] {
  if (status === "CANCELLED") {
    return [
      { ...STEPS.PENDING, state: "done", at: createdAt },
      {
        label: "Cancelled",
        description: "This booking was cancelled.",
        state: "cancelled",
        at: updatedAt,
      },
    ];
  }

  const reached = ORDER.indexOf(status);
  return (["PENDING", "CONFIRMED", "COMPLETED"] as const).map((key, i) => ({
    ...STEPS[key],
    // The final step is "done" once reached; otherwise the reached step is the current one.
    state:
      i < reached || (i === reached && key === "COMPLETED")
        ? "done"
        : i === reached
          ? "current"
          : "todo",
    at: i === 0 ? createdAt : i === reached ? updatedAt : undefined,
  }));
}

type BookingTimelineProps = { status: BookingStatus; createdAt: string; updatedAt: string };

/** Vertical status timeline: reached steps lime, future steps muted. */
export function BookingTimeline({ status, createdAt, updatedAt }: BookingTimelineProps) {
  const steps = buildSteps(status, createdAt, updatedAt);

  return (
    <ol>
      {steps.map((step, i) => (
        <li
          key={step.label}
          className="relative flex gap-4 pb-7 last:pb-0"
          aria-current={step.state === "current" ? "step" : undefined}
        >
          {i < steps.length - 1 && (
            <span
              className={cn(
                "absolute top-9 bottom-1 left-[17px] w-0.5 rounded-full",
                step.state === "done" ? "bg-primary" : "bg-surface-2",
              )}
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              "relative flex size-9 shrink-0 items-center justify-center rounded-full",
              (step.state === "done" || step.state === "current") &&
                "bg-primary text-primary-foreground",
              step.state === "current" && "ring-primary/25 ring-4",
              step.state === "todo" && "bg-surface-2 text-muted-foreground",
              step.state === "cancelled" && "bg-surface-2 text-foreground",
            )}
            aria-hidden="true"
          >
            {step.state === "done" && <Check className="size-4" strokeWidth={3} />}
            {step.state === "cancelled" && <CircleX className="size-4" />}
            {step.state === "current" && (
              <span className="bg-primary-foreground size-2.5 rounded-full" />
            )}
            {step.state === "todo" && <span className="text-xs font-semibold">{i + 1}</span>}
          </span>
          <div className="pt-1.5">
            <p
              className={cn(
                "font-medium",
                step.state === "todo" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {step.label}
              {step.state === "current" && step.label === "Pending" && (
                <span className="text-muted-foreground font-normal"> · Awaiting confirmation</span>
              )}
            </p>
            <p className="text-muted-foreground text-sm">{step.description}</p>
            {step.at && (
              <p className="text-muted-foreground mt-0.5 text-xs">{formatDateTime(step.at)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
