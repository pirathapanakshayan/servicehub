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

function buildSteps(status: BookingStatus, createdAt: string, updatedAt: string): Step[] {
  const booked: Step = {
    label: "Booked",
    description: "Your request was received.",
    state: "done",
    at: createdAt,
  };

  if (status === "CANCELLED") {
    return [
      booked,
      {
        label: "Cancelled",
        description: "This booking was cancelled.",
        state: "cancelled",
        at: updatedAt,
      },
    ];
  }

  const order: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];
  const reached = order.indexOf(status);
  return [
    booked,
    {
      label: "Confirmed",
      description: "The provider accepted your booking.",
      state: reached >= 1 ? "done" : "current",
      at: status === "CONFIRMED" ? updatedAt : undefined,
    },
    {
      label: "Completed",
      description: "The service has been delivered.",
      state: reached >= 2 ? "done" : "todo",
      at: status === "COMPLETED" ? updatedAt : undefined,
    },
  ];
}

type BookingTimelineProps = { status: BookingStatus; createdAt: string; updatedAt: string };

export function BookingTimeline({ status, createdAt, updatedAt }: BookingTimelineProps) {
  const steps = buildSteps(status, createdAt, updatedAt);

  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
          {i < steps.length - 1 && (
            <span
              className={cn(
                "absolute top-8 left-[15px] h-[calc(100%-2rem)] w-0.5",
                step.state === "done" ? "bg-primary" : "bg-border",
              )}
              aria-hidden="true"
            />
          )}
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
              step.state === "done" && "bg-primary border-primary text-primary-foreground",
              step.state === "current" && "border-warning bg-warning/15",
              step.state === "todo" && "border-border bg-card",
              step.state === "cancelled" && "border-slate-400 bg-slate-100 text-slate-600",
            )}
            aria-hidden="true"
          >
            {step.state === "done" && <Check className="size-4" />}
            {step.state === "cancelled" && <CircleX className="size-4" />}
            {step.state === "current" && <span className="bg-warning size-2.5 rounded-full" />}
          </span>
          <div className="pt-1">
            <p
              className={cn(
                "text-sm font-semibold",
                step.state === "todo" ? "text-muted-foreground" : "text-ink",
              )}
            >
              {step.label}
              {step.state === "current" && (
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
