"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { BookingForm } from "@/components/bookings/booking-form";
import { Button, ButtonArrow, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatDuration, formatPrice } from "@/lib/format";

type Service = { id: string; name: string; price: string; durationMinutes: number };

type BookingPanelProps = {
  service: Service;
  /** Who is viewing: customers book, guests are sent to log in, admins can't book. */
  viewer: "customer" | "guest" | "admin";
};

const DESKTOP = "(min-width: 1024px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on lg+ screens. The server assumes desktop; CSS hides the card on mobile until hydrated. */
function useIsDesktop() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => true,
  );
}

function PanelBody({ service, viewer }: BookingPanelProps) {
  if (viewer === "customer") return <BookingForm service={service} />;
  if (viewer === "admin") {
    return (
      <p className="bg-background text-muted-foreground rounded-inner p-4 text-center text-sm">
        Admin accounts can&apos;t make bookings.
      </p>
    );
  }
  const loginHref = `/login?redirect=${encodeURIComponent(`/services/${service.id}`)}`;
  return (
    <div className="space-y-3">
      <Link href={loginHref} className={buttonVariants({ size: "lg", className: "h-12 w-full" })}>
        Log in to book
        <ButtonArrow />
      </Link>
      <p className="text-muted-foreground text-center text-sm">
        New here?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Create a free account
        </Link>
      </p>
    </div>
  );
}

function PanelHeading({ service }: { service: Service }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-muted-foreground text-label">Price</p>
        <p className="text-foreground text-2xl font-semibold">{formatPrice(service.price)}</p>
      </div>
      <p className="bg-surface-2 text-foreground rounded-full px-3 py-1 text-sm">
        {formatDuration(service.durationMinutes)}
      </p>
    </div>
  );
}

/** Sticky booking card on desktop; a bottom sheet opened by a fixed "Book now" bar on mobile. */
export function BookingPanel({ service, viewer }: BookingPanelProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <section
        id="book"
        aria-labelledby="book-heading"
        className="bg-card shadow-surface rounded-card hidden space-y-6 p-6 lg:block"
      >
        <h2 id="book-heading" className="sr-only">
          Book this service
        </h2>
        <PanelHeading service={service} />
        <PanelBody service={service} viewer={viewer} />
      </section>
    );
  }

  return (
    <Sheet>
      {/* Spacer so the fixed bar never covers the end of the page. */}
      <div className="h-20" aria-hidden="true" />
      <div className="bg-background/80 fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-lg">
        <div className="bg-card shadow-surface mx-auto flex max-w-lg items-center justify-between gap-3 rounded-full py-2 pr-2 pl-5">
          <div className="min-w-0">
            <p className="text-foreground truncate font-semibold">{formatPrice(service.price)}</p>
            <p className="text-muted-foreground text-xs">
              {formatDuration(service.durationMinutes)}
            </p>
          </div>
          <SheetTrigger render={<Button size="lg" className="h-11 px-6" />}>
            Book now
            <ButtonArrow />
          </SheetTrigger>
        </div>
      </div>
      <SheetContent
        side="bottom"
        className="bg-card rounded-t-section max-h-[90svh] overflow-y-auto border-0 px-5 pb-8"
      >
        <SheetHeader className="px-0 pt-6">
          <SheetTitle className="text-h3 font-medium">Book {service.name}</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <PanelHeading service={service} />
          <PanelBody service={service} viewer={viewer} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
