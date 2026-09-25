import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { requirePageAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | ServiceHub Admin" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requirePageAdmin();

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="bg-card border-border sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r lg:flex">
        <Link
          href="/admin/dashboard"
          className="text-primary border-border flex h-16 items-center border-b px-6 text-lg font-bold"
        >
          ServiceHub Admin
        </Link>
        <div className="flex-1">
          <AdminNav />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar adminName={admin.name} />
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
