import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Admin login" };

export default function AdminLoginPage() {
  return (
    <AuthCard
      title="Admin login"
      badge="Admin"
      description="Sign in to manage services, users and bookings."
      footer={
        <>
          Not an admin?{" "}
          <Link href="/login" className="text-foreground font-medium underline underline-offset-4">
            Customer login
          </Link>
        </>
      }
    >
      <LoginForm variant="admin" redirectTo="/admin/dashboard" />
    </AuthCard>
  );
}
