"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { registerSchema, type RegisterInput } from "@/lib/validators";

const FIELDS = ["name", "email", "password", "confirmPassword", "phone"] as const;

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", phone: "" },
  });

  const onSubmit = async (values: RegisterInput) => {
    try {
      await apiFetch("/api/auth/register", { method: "POST", body: JSON.stringify(values) });
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        toast.error("Unable to create your account");
        return;
      }
      if (error.status === 409) setError("email", { message: error.message });
      for (const field of FIELDS) {
        const message = error.fields?.[field]?.[0];
        if (message) setError(field, { message });
      }
      toast.error(error.message);
      return;
    }

    // Registration does not start a session, so sign in with the same credentials.
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: values.email, password: values.password }),
      });
      toast.success("Account created. Welcome to ServiceHub!");
      router.replace("/dashboard");
      router.refresh();
    } catch {
      toast.success("Account created. Please log in.");
      router.replace("/login");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <FormField
        id="name"
        label="Full name"
        autoComplete="name"
        placeholder="Nimali Perera"
        registration={register("name")}
        error={errors.name?.message}
      />
      <FormField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        registration={register("email")}
        error={errors.email?.message}
      />
      <FormField
        id="phone"
        label="Phone (optional)"
        type="tel"
        autoComplete="tel"
        placeholder="+94 77 123 4567"
        registration={register("phone")}
        error={errors.phone?.message}
      />
      <FormField
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, with a letter and a number."
        registration={register("password")}
        error={errors.password?.message}
      />
      <FormField
        id="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        registration={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />
      <SubmitButton pending={isSubmitting} pendingText="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
