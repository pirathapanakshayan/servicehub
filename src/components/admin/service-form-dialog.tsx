"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nativeSelectClass } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { ServiceDTO } from "@/lib/services";
import { serviceSchema, type ServiceInput, type ServiceOutput } from "@/lib/validators";

type Category = { id: string; name: string };

type ServiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** The service being edited, or null to create a new one. */
  service: ServiceDTO | null;
  onSaved: () => void;
};

const FIELDS = [
  "name",
  "categoryId",
  "price",
  "durationMinutes",
  "imageUrl",
  "status",
  "description",
] as const;

function defaults(service: ServiceDTO | null, categories: Category[]): ServiceInput {
  return service
    ? {
        name: service.name,
        categoryId: service.categoryId,
        price: service.price,
        durationMinutes: service.durationMinutes,
        imageUrl: service.imageUrl ?? "",
        status: service.status,
        description: service.description,
      }
    : {
        name: "",
        categoryId: categories[0]?.id ?? "",
        price: "",
        durationMinutes: 60,
        imageUrl: "",
        status: "ACTIVE",
        description: "",
      };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} role="alert" className="text-danger text-xs">
      {message}
    </p>
  );
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  categories,
  service,
  onSaved,
}: ServiceFormDialogProps) {
  const isEdit = service !== null;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ServiceInput, unknown, ServiceOutput>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaults(service, categories),
  });

  // Load the selected service (or blank values) each time the dialog opens.
  useEffect(() => {
    if (open) reset(defaults(service, categories));
  }, [open, service, categories, reset]);

  const onSubmit = async (values: ServiceOutput) => {
    try {
      await apiFetch(isEdit ? `/api/services/${service.id}` : "/api/services", {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({ ...values, imageUrl: values.imageUrl ?? "" }),
      });
      toast.success(isEdit ? "Service updated" : "Service created");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const field of FIELDS) {
          const message = error.fields?.[field]?.[0];
          if (message) setError(field, { message });
        }
        toast.error(error.message);
      } else {
        toast.error("Unable to save service");
      }
    }
  };

  const invalid = (field: (typeof FIELDS)[number]) =>
    errors[field]
      ? { "aria-invalid": true as const, "aria-describedby": `svc-${field}-error` }
      : {};

  return (
    <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details customers see." : "Create a new bookable service."}
          </DialogDescription>
        </DialogHeader>

        <form id="service-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Name</Label>
            <Input id="svc-name" className="h-10" {...register("name")} {...invalid("name")} />
            <FieldError id="svc-name" message={errors.name?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="svc-categoryId">Category</Label>
              <select
                id="svc-categoryId"
                className={nativeSelectClass}
                {...register("categoryId")}
                {...invalid("categoryId")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError id="svc-categoryId" message={errors.categoryId?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-status">Status</Label>
              <select id="svc-status" className={nativeSelectClass} {...register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Price (LKR)</Label>
              <Input
                id="svc-price"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                className="h-10"
                {...register("price")}
                {...invalid("price")}
              />
              <FieldError id="svc-price" message={errors.price?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-durationMinutes">Duration (minutes)</Label>
              <Input
                id="svc-durationMinutes"
                type="number"
                inputMode="numeric"
                min={15}
                max={480}
                step={15}
                className="h-10"
                {...register("durationMinutes")}
                {...invalid("durationMinutes")}
              />
              <FieldError id="svc-durationMinutes" message={errors.durationMinutes?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-imageUrl">Image URL (optional)</Label>
            <Input
              id="svc-imageUrl"
              type="url"
              placeholder="https://..."
              className="h-10"
              {...register("imageUrl")}
              {...invalid("imageUrl")}
            />
            <FieldError id="svc-imageUrl" message={errors.imageUrl?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="svc-description">Description</Label>
            <Textarea
              id="svc-description"
              rows={4}
              maxLength={2000}
              {...register("description")}
              {...invalid("description")}
            />
            <FieldError id="svc-description" message={errors.description?.message} />
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="service-form" className="h-10" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
