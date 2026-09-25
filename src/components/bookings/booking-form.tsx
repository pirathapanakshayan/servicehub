"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarDays, Clock, LoaderCircle, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
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

export function BookingForm({ service }: BookingFormProps) {
  const router = useRouter();
  const today = useMemo(businessToday, []);
  const [slots, setSlots] = useState<SlotsState>({ status: "idle" });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      router.push(`/my-bookings/${data.id}`);
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

  const selectedDate = bookingDate ? new Date(`${bookingDate}T00:00:00`) : undefined;

  return (
    <form onSubmit={handleSubmit(() => setConfirmOpen(true))} className="space-y-6" noValidate>
      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <fieldset className="space-y-2">
          <legend className="text-ink mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="size-4" aria-hidden="true" />
            1. Choose a date
          </legend>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={selectDate}
            disabled={{ before: today }}
            startMonth={today}
            className="border-border rounded-card w-fit border"
          />
          {errors.bookingDate && (
            <p role="alert" className="text-danger text-sm">
              Please choose a date.
            </p>
          )}
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-ink mb-2 flex items-center gap-2 text-sm font-semibold">
            <Clock className="size-4" aria-hidden="true" />
            2. Choose a time
          </legend>
          {slots.status === "idle" && (
            <p className="text-muted-foreground text-sm">Select a date to see available times.</p>
          )}
          {slots.status === "loading" && (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-busy="true">
              <span className="sr-only">Loading available times...</span>
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="rounded-control h-10" />
              ))}
            </div>
          )}
          {slots.status === "error" && (
            <div className="space-y-2">
              <p role="alert" className="text-danger text-sm">
                {slots.message}
              </p>
              <Button type="button" variant="outline" onClick={() => loadSlots(bookingDate)}>
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
            <div
              className="grid grid-cols-3 gap-2 sm:grid-cols-4"
              role="group"
              aria-label="Available times"
            >
              {slots.times.map((time) => {
                const selected = time === bookingTime;
                return (
                  <button
                    key={time}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setValue("bookingTime", time, { shouldValidate: true })}
                    className={cn(
                      "rounded-control h-10 border text-sm font-medium transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border bg-card hover:border-primary hover:text-primary",
                    )}
                  >
                    {formatTime(time)}
                  </button>
                );
              })}
            </div>
          )}
          {errors.bookingTime && bookingDate && (
            <p role="alert" className="text-danger text-sm">
              Please choose a time.
            </p>
          )}
        </fieldset>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">3. Notes for the provider (optional)</Label>
        <Textarea
          id="notes"
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

      <div className="bg-background border-border rounded-card space-y-2 border p-4 text-sm">
        <p className="text-ink font-semibold">Summary</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Service</dt>
          <dd className="text-ink text-right font-medium">{service.name}</dd>
          <dt className="text-muted-foreground">Date</dt>
          <dd className="text-ink text-right">{bookingDate ? formatDate(bookingDate) : "—"}</dd>
          <dt className="text-muted-foreground">Time</dt>
          <dd className="text-ink text-right">{bookingTime ? formatTime(bookingTime) : "—"}</dd>
          <dt className="text-muted-foreground">Duration</dt>
          <dd className="text-ink text-right">{formatDuration(service.durationMinutes)}</dd>
          <dt className="text-ink border-border mt-1 border-t pt-2 font-semibold">Total</dt>
          <dd className="text-ink border-border mt-1 border-t pt-2 text-right text-base font-bold">
            {formatPrice(service.price)}
          </dd>
        </dl>
      </div>

      <Button type="submit" className="h-11 w-full">
        Review booking
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
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
              {submitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {submitting ? "Booking..." : "Confirm booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
