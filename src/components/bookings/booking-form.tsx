"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { LayoutGroup, motion, MotionConfig } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { nowInBusinessZone } from "@/lib/booking-rules";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  bookingCreateSchema,
  type BookingCreateInput,
  type BookingCreateOutput,
} from "@/lib/validators";

type BookingFormProps = {
  service: { id: string; name: string; price: string; durationMinutes: number };
};

type SlotsState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; times: string[] };

/** Today in the business time zone, as a local-midnight Date for the calendar. */
function businessToday(): Date {
  const [y, m, d] = nowInBusinessZone().date.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
}

// Dark day cells, lime selected day; disabled (past) days fade out.
const calendarClass = cn(
  "w-full bg-transparent p-0 [--cell-radius:9999px] [--cell-size:--spacing(10)]",
  "[&_td_button]:bg-surface-2 [&_td_button]:text-foreground [&_td_button:hover]:bg-secondary",
  "[&_td_button[data-selected-single=true]]:bg-primary [&_td_button[data-selected-single=true]]:text-primary-foreground",
  "[&_td_button:disabled]:bg-transparent",
);

const legendClass = "text-foreground mb-3 text-sm font-medium";

export function BookingForm({ service }: BookingFormProps) {
  const router = useRouter();
  const today = useMemo(businessToday, []);
  const groupId = useId();
  const [slots, setSlots] = useState<SlotsState>({ status: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookedId, setBookedId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<BookingCreateInput, unknown, BookingCreateOutput>({
    resolver: zodResolver(bookingCreateSchema),
    defaultValues: { serviceId: service.id, bookingDate: "", bookingTime: "", notes: "" },
  });

  const bookingDate = watch("bookingDate");
  const bookingTime = watch("bookingTime");
  const notes = watch("notes") ?? "";

  const loadSlots = useCallback(
    async (date: string, signal?: AbortSignal) => {
      setSlots({ status: "loading" });
      try {
        const { data } = await apiFetch<{ data: { times: string[] } }>(
          `/api/services/${service.id}/slots?date=${date}`,
          { signal },
        );
        setSlots({ status: "ready", times: data.times });
      } catch (error) {
        if (signal?.aborted) return;
        setSlots({
          status: "error",
          message: error instanceof ApiClientError ? error.message : "Could not load times",
        });
      }
    },
    [service.id],
  );

  useEffect(() => {
    if (!bookingDate) return;
    const controller = new AbortController();
    loadSlots(bookingDate, controller.signal);
    return () => controller.abort();
  }, [bookingDate, loadSlots]);

  const selectDate = (date: Date | undefined) => {
    setValue("bookingDate", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true });
    setValue("bookingTime", "");
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data } = await apiFetch<{ data: { id: string } }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ serviceId: service.id, bookingDate, bookingTime, notes }),
      });
      toast.success("Booking requested! We'll confirm it shortly.");
      setConfirmOpen(false);
      setBookedId(data.id);
      router.refresh();
    } catch (error) {
      setConfirmOpen(false);
      if (error instanceof ApiClientError && error.status === 409) {
        toast.error(error.message, { description: "Please pick another time." });
        setValue("bookingTime", "");
        loadSlots(bookingDate);
      } else if (error instanceof ApiClientError && error.status === 401) {
        toast.error("Your session has expired. Please log in again.");
        router.push(`/login?redirect=${encodeURIComponent(`/services/${service.id}`)}`);
      } else {
        toast.error(error instanceof ApiClientError ? error.message : "Unable to create booking");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const bookAnother = () => {
    reset();
    setSlots({ status: "idle" });
    setBookedId(null);
  };

  if (bookedId) {
    return (
      <BookingSuccess
        summary={`${service.name} on ${formatDate(bookingDate)} at ${formatTime(bookingTime)}`}
        bookingId={bookedId}
        onBookAnother={bookAnother}
      />
    );
  }

  const selectedDate = bookingDate ? new Date(`${bookingDate}T00:00:00`) : undefined;

  return (
    <MotionConfig reducedMotion="user">
      <form onSubmit={handleSubmit(() => setConfirmOpen(true))} className="space-y-6" noValidate>
        <fieldset>
          <legend className={legendClass}>Choose a date</legend>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={selectDate}
            disabled={{ before: today }}
            startMonth={today}
            showOutsideDays={false}
            className={calendarClass}
            classNames={{ root: "w-full", month: "flex w-full flex-col gap-3" }}
          />
          {errors.bookingDate && (
            <p role="alert" className="text-danger mt-2 text-sm">
              Please choose a date.
            </p>
          )}
        </fieldset>

        <fieldset>
          <legend className={legendClass}>Choose a time</legend>
          {slots.status === "idle" && (
            <p className="text-muted-foreground text-sm">Select a date to see available times.</p>
          )}
          {slots.status === "loading" && (
            <div className="grid grid-cols-3 gap-2" aria-busy="true">
              <span className="sr-only">Loading available times...</span>
              {Array.from({ length: 9 }, (_, i) => (
                <div key={i} className="bg-surface-2 shimmer h-10 rounded-full" />
              ))}
            </div>
          )}
          {slots.status === "error" && (
            <div className="space-y-2">
              <p role="alert" className="text-danger text-sm">
                {slots.message}
              </p>
              <Button type="button" variant="ghost" onClick={() => loadSlots(bookingDate)}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            </div>
          )}
          {slots.status === "ready" && slots.times.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No times left on {formatDate(bookingDate)}. Please choose another date.
            </p>
          )}
          {slots.status === "ready" && slots.times.length > 0 && (
            <LayoutGroup id={groupId}>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Available times">
                {slots.times.map((time) => {
                  const selected = time === bookingTime;
                  return (
                    <button
                      key={time}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setValue("bookingTime", time, { shouldValidate: true })}
                      className={cn(
                        "bg-surface-2 relative h-10 rounded-full text-sm font-medium transition-colors",
                        selected ? "text-primary-foreground" : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId="slot-selection"
                          aria-hidden="true"
                          className="bg-primary absolute inset-0 rounded-full"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                        />
                      )}
                      <span className="relative">{formatTime(time)}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          )}
          {errors.bookingTime && bookingDate && (
            <p role="alert" className="text-danger mt-2 text-sm">
              Please choose a time.
            </p>
          )}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor={`${groupId}-notes`}>Notes for the provider (optional)</Label>
          <Textarea
            id={`${groupId}-notes`}
            rows={3}
            maxLength={500}
            placeholder="Access instructions, specific requests..."
            aria-invalid={errors.notes ? true : undefined}
            {...register("notes")}
          />
          <p className={cn("text-xs", errors.notes ? "text-danger" : "text-muted-foreground")}>
            {errors.notes?.message ?? `${notes.length}/500`}
          </p>
        </div>

        <dl className="bg-background rounded-inner grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-4 text-sm">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="text-foreground text-right">
            {bookingDate ? formatDate(bookingDate) : "—"}
          </dd>
          <dt className="text-muted-foreground">Time</dt>
          <dd className="text-foreground text-right">
            {bookingTime ? formatTime(bookingTime) : "—"}
          </dd>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="text-foreground text-right">{formatDuration(service.durationMinutes)}</dd>
          <dt className="text-foreground border-border mt-1 border-t pt-3 font-medium">Total</dt>
          <dd className="text-foreground border-border mt-1 border-t pt-3 text-right text-base font-semibold">
            {formatPrice(service.price)}
          </dd>
        </dl>

        <Button type="submit" size="lg" className="h-12 w-full text-base" arrow>
          Confirm booking
        </Button>

        <AlertDialog
          open={confirmOpen}
          onOpenChange={(open) => !submitting && setConfirmOpen(open)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm your booking</AlertDialogTitle>
              <AlertDialogDescription>
                {service.name} on {bookingDate && formatDate(bookingDate)} at{" "}
                {bookingTime && formatTime(bookingTime)} for {formatPrice(service.price)}. You can
                cancel any time before the service is completed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Go back</AlertDialogCancel>
              <AlertDialogAction onClick={submit} disabled={submitting}>
                {submitting && (
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden="true"
                  />
                )}
                {submitting ? "Booking..." : "Confirm booking"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </form>
    </MotionConfig>
  );
}

function BookingSuccess({
  summary,
  bookingId,
  onBookAnother,
}: {
  summary: string;
  bookingId: string;
  onBookAnother: () => void;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex flex-col items-center gap-4 py-6 text-center" role="status">
        <motion.span
          className="bg-primary text-primary-foreground flex size-20 items-center justify-center rounded-full"
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 18 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="size-10" fill="none">
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              className="animate-draw-check"
            />
          </svg>
        </motion.span>
        <h3 className="text-h3 text-foreground font-medium">Booking requested</h3>
        <p className="text-muted-foreground text-sm">{summary}. We&apos;ll confirm it shortly.</p>
        <div className="flex w-full flex-col gap-2">
          <Link
            href={`/my-bookings/${bookingId}`}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            View booking
          </Link>
          <Button type="button" variant="ghost" size="lg" onClick={onBookAnother}>
            Book another time
          </Button>
        </div>
      </div>
    </MotionConfig>
  );
}
