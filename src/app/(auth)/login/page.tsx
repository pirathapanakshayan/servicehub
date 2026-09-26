import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/validators";

export const metadata: Metadata = { title: "Log in" };

type LoginPageProps = {
  searchParams: Promise<{ redirect?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirect } = await searchParams;
  const redirectTo = safeRedirectPath(
    Array.isArray(redirect) ? redirect[0] : redirect,
    "/dashboard",
  );

  return (
    <AuthCard
      title="Welcome back"
      description="Log in to book services and manage your bookings."
      footer={
        <>
          New to ServiceHub?{" "}
          <Link
            href="/register"
            className="text-foreground font-medium underline underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm variant="customer" redirectTo={redirectTo} />
    </AuthCard>
  );
}
