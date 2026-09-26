"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { AdminEmpty, TableShell, rowClass, tdClass, thClass } from "@/components/admin/admin-table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { PageActions } from "@/components/admin/page-actions";
import { ServiceFormDialog } from "@/components/admin/service-form-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { formatDuration, formatPrice } from "@/lib/format";
import type { ServiceDTO } from "@/lib/services";
import { cn } from "@/lib/utils";

type ServicesTableProps = {
  services: ServiceDTO[];
  categories: { id: string; name: string }[];
  hasFilters: boolean;
  total: number;
};

export function ServicesTable({ services, categories, hasFilters, total }: ServicesTableProps) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceDTO | null>(null);
  const [deleting, setDeleting] = useState<ServiceDTO | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const toggleStatus = async (service: ServiceDTO) => {
    const status = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setToggling(service.id);
    try {
      // PUT takes the full service, so resend current values with the new status.
      await apiFetch(`/api/services/${service.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          price: service.price,
          durationMinutes: service.durationMinutes,
          categoryId: service.categoryId,
          imageUrl: service.imageUrl ?? "",
          status,
        }),
      });
      toast.success(`${service.name} is now ${status === "ACTIVE" ? "active" : "inactive"}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to update status");
    } finally {
      setToggling(null);
    }
  };

  const deleteService = async () => {
    if (!deleting) return;
    try {
      await apiFetch(`/api/services/${deleting.id}`, { method: "DELETE" });
      toast.success(`${deleting.name} deleted`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to delete service");
      // A 409 won't succeed on retry, so close the dialog; other errors keep it open.
      if (error instanceof ApiClientError && error.status === 409) return;
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <PageActions>
        <Button
          className="h-11 rounded-full px-5"
          onClick={openCreate}
          disabled={categories.length === 0}
        >
          <Plus aria-hidden="true" />
          Add service
        </Button>
      </PageActions>
      <p className="text-admin-muted text-[13px]" aria-live="polite">
        {total} {total === 1 ? "service" : "services"}
      </p>

      {services.length === 0 ? (
        <AdminEmpty
          title={hasFilters ? "No services match your filters" : "No services yet"}
          description={
            hasFilters
              ? "Try a different search, category or status."
              : "Add your first service so customers can start booking."
          }
          action={
            !hasFilters && (
              <Button className="mt-2 rounded-full" onClick={openCreate}>
                <Plus aria-hidden="true" />
                Add service
              </Button>
            )
          }
        />
      ) : (
        <TableShell label="Services">
          <thead>
            <tr>
              <th className={thClass}>Name</th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Price</th>
              <th className={thClass}>Duration</th>
              <th className={thClass}>Status</th>
              <th className={`${thClass} text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => {
              const active = s.status === "ACTIVE";
              return (
                <tr key={s.id} className={rowClass(false)}>
                  <td className={`${tdClass} text-ink max-w-64 font-medium`}>
                    <span className="line-clamp-2">{s.name}</span>
                  </td>
                  <td className={`${tdClass} whitespace-nowrap`}>{s.category.name}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>{formatPrice(s.price)}</td>
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {formatDuration(s.durationMinutes)}
                  </td>
                  <td className={tdClass}>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={active}
                      aria-label={`Active status for ${s.name}`}
                      disabled={toggling === s.id}
                      onClick={() => toggleStatus(s)}
                      className="group flex items-center gap-2 disabled:opacity-50"
                    >
                      <span
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
                          active ? "bg-primary" : "bg-muted-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                            active ? "translate-x-4.5" : "translate-x-0.5",
                          )}
                        />
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          active ? "text-ink" : "text-muted-foreground",
                        )}
                      >
                        {active ? "Active" : "Inactive"}
                      </span>
                    </button>
                  </td>
                  <td className={`${tdClass} text-right whitespace-nowrap`}>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${s.name}`}
                      onClick={() => {
                        setEditing(s);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-danger hover:text-danger hover:bg-danger/10"
                      aria-label={`Delete ${s.name}`}
                      onClick={() => setDeleting(s)}
                    >
                      <Trash2 />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <ServiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        service={editing}
        onSaved={() => router.refresh()}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this service?"
        description={
          <>
            <strong>{deleting?.name}</strong> will be permanently deleted. Services with bookings
            can&apos;t be deleted; set them to inactive instead.
          </>
        }
        confirmLabel="Delete service"
        pendingLabel="Deleting..."
        destructive
        onConfirm={deleteService}
      />
    </div>
  );
}
