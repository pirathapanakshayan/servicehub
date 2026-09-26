"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { PasswordStrength } from "@/components/auth/password-strength";
import { SubmitButton } from "@/components/auth/submit-button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { passwordChangeSchema, type PasswordChangeInput } from "@/lib/validators";

const EMPTY = { currentPassword: "", newPassword: "", confirmNewPassword: "" };

export function PasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeInput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = async (values: PasswordChangeInput) => {
    try {
      await apiFetch("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });
      toast.success("Password changed");
      reset(EMPTY);
    } catch (error) {
      if (error instanceof ApiClientError) {
        for (const field of ["currentPassword", "newPassword"] as const) {
          const message = error.fields?.[field]?.[0];
          if (message) setError(field, { message });
        }
        toast.error(error.message);
      } else {
        toast.error("Unable to change password");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        registration={register("currentPassword")}
        error={errors.currentPassword?.message}
      />
      <FormField
        id="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        registration={register("newPassword")}
        error={errors.newPassword?.message}
      >
        <PasswordStrength password={watch("newPassword")} />
      </FormField>
      <FormField
        id="confirmNewPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        registration={register("confirmNewPassword")}
        error={errors.confirmNewPassword?.message}
      />
      <div className="sm:max-w-56">
        <SubmitButton pending={isSubmitting} pendingText="Updating...">
          Change password
        </SubmitButton>
      </div>
    </form>
  );
}
