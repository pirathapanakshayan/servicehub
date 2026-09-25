"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { profileSchema, type ProfileInput } from "@/lib/validators";

type ProfileFormProps = { user: { name: string; email: string; phone: string | null } };

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, phone: user.phone ?? "" },
  });

  const onSubmit = async (values: ProfileInput) => {
    try {
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ name: values.name, phone: values.phone ?? "" }),
      });
      toast.success("Profile updated");
      reset(values);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const field of ["name", "phone"] as const) {
          const message = error.fields?.[field]?.[0];
          if (message) setError(field, { message });
        }
        toast.error(error.message);
      } else {
        toast.error("Unable to update profile");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="name"
        label="Full name"
        autoComplete="name"
        registration={register("name")}
        error={errors.name?.message}
      />
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={user.email} disabled readOnly className="h-10" />
        <p className="text-muted-foreground text-xs">Email can&apos;t be changed.</p>
      </div>
      <FormField
        id="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+94 77 123 4567"
        registration={register("phone")}
        error={errors.phone?.message}
      />
      <div className="sm:max-w-48">
        <SubmitButton pending={isSubmitting} pendingText="Saving...">
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
