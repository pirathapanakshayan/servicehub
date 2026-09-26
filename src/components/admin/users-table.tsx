"use client";

import { Mail, Phone, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminEmpty, TableShell, rowClass, tdClass, thClass } from "@/components/admin/admin-table";
import { InitialsAvatar } from "@/components/admin/avatar";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { ActivePill, StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerDTO, UserWithBookingsDTO } from "@/lib/admin";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type UsersTableProps = { users: CustomerDTO[]; hasFilters: boolean; total: number };

type DetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; user: UserWithBookingsDTO };

function UserBookings({ userId, refreshKey }: { userId: string; refreshKey: number }) {
  const [state, setState] = useState<DetailState>({ status: "loading" });

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState({ status: "loading" });
      try {
        const { data } = await apiFetch<{ data: UserWithBookingsDTO }>(
          `/api/admin/users/${userId}`,
          { signal },
        );
        setState({ status: "ready", user: data });
      } catch (error) {
        if (signal?.aborted) return;
        setState({
          status: "error",
          message: error instanceof ApiClientError ? error.message : "Could not load bookings",
        });
      }
    },
    [userId],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load, refreshKey]);

  if (state.status === "loading") {
    return (
      <div className="space-y-3" aria-busy="true">
        <span className="sr-only">Loading bookings...</span>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="rounded-card h-16" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-2">
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
        <Button variant="outline" onClick={() => load()}>
          <RefreshCw aria-hidden="true" />
          Try again
        </Button>
      </div>
    );
  }

  const { bookings } = state.user;
  if (bookings.length === 0) {
    return <p className="text-muted-foreground text-sm">This customer has no bookings yet.</p>;
  }

  const spent = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} · {formatPrice(spent)}{" "}
        spent
      </p>
      <ul className="space-y-2">
        {bookings.map((b) => (
          <li key={b.id} className="border-border rounded-control space-y-1 border p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-ink text-sm font-medium">{b.service.name}</p>
              <StatusPill status={b.status} />
            </div>
            <p className="text-muted-foreground text-xs">
              {formatDate(b.bookingDate)} · {formatTime(b.bookingTime)} ·{" "}
              {formatPrice(b.totalPrice)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UsersTable({ users, hasFilters, total }: UsersTableProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<CustomerDTO | null>(null);
  const selected = users.find((u) => u.id === selectedId) ?? null;

  const toggleActive = async () => {
    if (!toggling) return;
    const isActive = !toggling.isActive;
    try {
      await apiFetch(`/api/admin/users/${toggling.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      toast.success(`${toggling.name} ${isActive ? "activated" : "deactivated"}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update user");
      throw error;
    }
  };

  if (users.length === 0) {
    return (
      <AdminEmpty
        title={hasFilters ? "No customers match your filters" : "No customers yet"}
        description={
          hasFilters
            ? "Try a different name, email or status."
            : "Customers will appear here once they register."
        }
      />
    );
  }

  const toggleButton = (u: CustomerDTO, className?: string) => (
    <Button
      variant={u.isActive ? "outline" : "default"}
      size="sm"
      className={cn("rounded-full", u.isActive && "text-danger hover:text-danger", className)}
      onClick={(e) => {
        e.stopPropagation();
        setToggling(u);
      }}
      onKeyDown={(e) => e.stopPropagation()}
      aria-label={`${u.isActive ? "Deactivate" : "Activate"} ${u.name}`}
    >
      {u.isActive ? "Deactivate" : "Activate"}
    </Button>
  );

  return (
    <>
      <p className="text-admin-muted text-[13px]" aria-live="polite">
        {total} {total === 1 ? "customer" : "customers"}
      </p>
      <TableShell label="Customers">
        <thead>
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Phone</th>
            <th className={thClass}>Joined</th>
            <th className={`${thClass} text-right`}>Bookings</th>
            <th className={thClass}>Status</th>
            <th className={`${thClass} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className={rowClass(true)}
              tabIndex={0}
              aria-label={`View ${u.name}`}
              onClick={() => setSelectedId(u.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedId(u.id);
                }
              }}
            >
              <td className={tdClass}>
                <div className="flex items-center gap-3">
                  <InitialsAvatar name={u.name} size="sm" decorative />
                  <div className="min-w-0">
                    <p className="text-ink font-medium">{u.name}</p>
                    <p className="text-muted-foreground text-xs">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>{u.phone ?? "—"}</td>
              <td className={`${tdClass} whitespace-nowrap`}>
                {formatDate(u.createdAt.slice(0, 10))}
              </td>
              <td className={`${tdClass} text-right font-medium`}>{u.bookingCount}</td>
              <td className={tdClass}>
                <ActivePill active={u.isActive} />
              </td>
              <td className={`${tdClass} text-right`}>{toggleButton(u)}</td>
            </tr>
          ))}
        </tbody>
      </TableShell>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="border-border border-b pr-12">
                <SheetTitle className="text-lg">{selected.name}</SheetTitle>
                <SheetDescription>
                  Customer since {formatDate(selected.createdAt.slice(0, 10))}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <section className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <ActivePill active={selected.isActive} />
                    {toggleButton(selected)}
                  </div>
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Mail className="size-4" aria-hidden="true" />
                    <a href={`mailto:${selected.email}`} className="hover:text-ink">
                      {selected.email}
                    </a>
                  </p>
                  {selected.phone && (
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <Phone className="size-4" aria-hidden="true" />
                      <a href={`tel:${selected.phone}`} className="hover:text-ink">
                        {selected.phone}
                      </a>
                    </p>
                  )}
                </section>
                <section className="space-y-3">
                  <h3 className="text-ink text-sm font-semibold">Bookings</h3>
                  <UserBookings userId={selected.id} refreshKey={selected.bookingCount} />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={toggling !== null}
        onOpenChange={(open) => !open && setToggling(null)}
        title={toggling?.isActive ? "Deactivate this customer?" : "Activate this customer?"}
        description={
          toggling?.isActive
            ? `${toggling.name} will be logged out and won't be able to log in or make bookings. Their existing bookings are kept.`
            : `${toggling?.name} will be able to log in and make bookings again.`
        }
        confirmLabel={toggling?.isActive ? "Deactivate" : "Activate"}
        pendingLabel="Saving..."
        destructive={toggling?.isActive}
        onConfirm={toggleActive}
      />
    </>
  );
}
