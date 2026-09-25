"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { loginSchema, type LoginInput } from "@/lib/validators";

type LoginFormProps = {
  variant: "customer" | "admin";
  redirectTo: string;
};

type LoginResponse = { user: { role: "CUSTOMER" | "ADMIN" } };

export function LoginForm({ variant, redirectTo }: LoginFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const { user } = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ ...values, adminOnly: variant === "admin" }),
      });
      toast.success("Welcome back!");
      router.replace(user.role === "ADMIN" ? "/admin/dashboard" : redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof ApiClientError ? error.message : "Unable to log in");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
        id="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        registration={register("password")}
        error={errors.password?.message}
      />
      <SubmitButton pending={isSubmitting} pendingText="Logging in...">
        {variant === "admin" ? "Log in to admin" : "Log in"}
      </SubmitButton>
    </form>
  );
}
